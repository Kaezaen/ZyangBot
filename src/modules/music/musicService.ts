import type { Client } from "discord.js";
import { Connectors, type Player, Shoukaku } from "shoukaku";
import { config } from "../../core/config/index.js";
import { logger } from "../../core/logger/index.js";
import {
  recordPlaybackError,
  recordTrackPlayed,
  setActiveMusicQueues,
  setLavalinkConnected,
} from "../../services/metrics.js";
import type { PlayerCardTrack, PlayerView } from "../../ui/playerCard.js";
import { GuildQueue } from "./guildQueue.js";
import { attachQueueAdvancement } from "./playerEvents.js";
import type { Track } from "./track.js";
import { normalizeQuery, toTracks } from "./trackResolver.js";

type JoinInput = {
  guildId: string;
  channelId: string;
  shardId: number;
};

type EnqueueInput = JoinInput & {
  query: string;
  requestedByUserId: string;
};

export type EnqueueResult = {
  addedTracks: readonly Track[];
  startedPlayback: boolean;
};

/** Emitted whenever the persistent Player Card should be re-rendered. */
export type PlayerCardUpdate = { guildId: string; view: PlayerView };

function toPlayerCardTrack(track: Track): PlayerCardTrack {
  return {
    title: track.title,
    author: track.author,
    durationMs: track.durationMs,
    ...(track.sourceUrl ? { sourceUrl: track.sourceUrl } : {}),
    ...(track.thumbnailUrl ? { thumbnailUrl: track.thumbnailUrl } : {}),
  };
}

export class MusicService {
  private readonly queues = new Map<string, GuildQueue>();
  private readonly attachedPlayers = new Set<string>();
  private shoukaku: Shoukaku | undefined;
  private lavalinkConnected = false;
  private readonly lastTracks = new Map<string, Track>();
  private updateListener: ((update: PlayerCardUpdate) => void) | undefined;

  initialize(client: Client): void {
    if (this.shoukaku) {
      return;
    }

    this.shoukaku = new Shoukaku(
      new Connectors.DiscordJS(client),
      [
        {
          name: config.lavalink.name,
          url: config.lavalink.url,
          auth: config.lavalink.password,
        },
      ],
      {
        reconnectTries: 5,
        reconnectInterval: 5_000,
        restTimeout: 15_000,
      },
    );

    this.shoukaku.on("ready", (name) => {
      logger.info({ node: name }, "Lavalink node connected");
      this.lavalinkConnected = true;
      setLavalinkConnected(true);
    });

    this.shoukaku.on("error", (name, error) => {
      logger.error({ err: error, node: name }, "Lavalink node error");
    });

    this.shoukaku.on("close", (name, code, reason) => {
      logger.warn({ node: name, code, reason }, "Lavalink node disconnected");
      this.lavalinkConnected = false;
      setLavalinkConnected(false);
    });
  }

  getQueue(guildId: string): GuildQueue | undefined {
    return this.queues.get(guildId);
  }

  async join(input: JoinInput): Promise<void> {
    await this.getOrCreatePlayer(input);
  }

  async leave(guildId: string): Promise<boolean> {
    const player = this.getManager().players.get(guildId);

    if (!player) {
      return false;
    }

    await this.getManager().leaveVoiceChannel(guildId);
    this.queues.delete(guildId);
    this.attachedPlayers.delete(guildId);
    setActiveMusicQueues(this.queues.size);
    this.emit(guildId, this.disconnectedView("Left the voice channel."));
    this.lastTracks.delete(guildId);

    return true;
  }

  async enqueue(input: EnqueueInput): Promise<EnqueueResult> {
    const node = this.getManager().getIdealNode();

    if (!node) {
      throw new Error("No Lavalink node is available.");
    }

    const response = await node.rest.resolve(normalizeQuery(input.query));
    const resolvedTracks = toTracks(
      response?.loadType,
      response?.data,
      input.requestedByUserId,
    );

    if (resolvedTracks.length === 0) {
      logger.warn(
        { query: input.query, loadType: response?.loadType },
        "Query resolved to no playable tracks",
      );
      throw new Error("No tracks found for that query.");
    }

    await this.getOrCreatePlayer(input);

    const queue = this.getOrCreateQueue(input.guildId);
    const shouldStartPlayback = queue.isEmpty;

    for (const track of resolvedTracks) {
      queue.add(track);
    }

    if (shouldStartPlayback) {
      await this.playCurrent(input.guildId);
    }

    const view = this.activeView(input.guildId);
    if (view) {
      this.emit(input.guildId, view);
    }

    return {
      addedTracks: resolvedTracks,
      startedPlayback: shouldStartPlayback,
    };
  }

  async pause(guildId: string): Promise<boolean> {
    const player = this.getManager().players.get(guildId);

    if (!player || !this.getQueue(guildId)?.current || player.paused) {
      return false;
    }

    await player.setPaused(true);

    const view = this.activeView(guildId);
    if (view) {
      this.emit(guildId, view);
    }

    return true;
  }

  async resume(guildId: string): Promise<boolean> {
    const player = this.getManager().players.get(guildId);

    if (!player || !this.getQueue(guildId)?.current || !player.paused) {
      return false;
    }

    await player.setPaused(false);

    const view = this.activeView(guildId);
    if (view) {
      this.emit(guildId, view);
    }

    return true;
  }

  async skip(guildId: string): Promise<Track | undefined> {
    const queue = this.getQueue(guildId);
    const player = this.getManager().players.get(guildId);

    if (!queue?.current || !player) {
      return undefined;
    }

    const skippedTrack = queue.advance();

    if (queue.current) {
      await this.playCurrent(guildId);
      const view = this.activeView(guildId);
      if (view) {
        this.emit(guildId, view);
      }
    } else {
      await player.stopTrack();
      this.emit(
        guildId,
        this.finishedView(guildId, "Playback finished — the queue is empty."),
      );
    }

    return skippedTrack;
  }

  async stop(guildId: string): Promise<boolean> {
    const queue = this.getQueue(guildId);
    const player = this.getManager().players.get(guildId);

    if (!queue || !player) {
      return false;
    }

    queue.clear();
    await player.stopTrack();
    this.emit(guildId, this.finishedView(guildId, "Playback stopped."));

    return true;
  }

  async setVolume(guildId: string, volume: number): Promise<boolean> {
    const player = this.getManager().players.get(guildId);

    if (!player) {
      return false;
    }

    await player.setGlobalVolume(volume);
    return true;
  }

  isPaused(guildId: string): boolean {
    return this.getManager().players.get(guildId)?.paused ?? false;
  }

  isLavalinkConnected(): boolean {
    return this.lavalinkConnected;
  }

  /** Registers the single listener that renders the persistent Player Card. */
  onPlayerUpdate(listener: (update: PlayerCardUpdate) => void): void {
    this.updateListener = listener;
  }

  /** Re-emits the current view so the Player Card can be re-summoned. */
  refresh(guildId: string): boolean {
    const view = this.activeView(guildId);

    if (!view) {
      return false;
    }

    this.emit(guildId, view);
    return true;
  }

  private emit(guildId: string, view: PlayerView): void {
    this.updateListener?.({ guildId, view });
  }

  private voiceChannelId(guildId: string): string | undefined {
    return this.shoukaku?.connections.get(guildId)?.channelId ?? undefined;
  }

  /** The playing/paused view for the current track, or undefined if none. */
  private activeView(guildId: string): PlayerView | undefined {
    const queue = this.getQueue(guildId);
    const track = queue?.current;
    const player = this.shoukaku?.players.get(guildId);

    if (!track || !player) {
      return undefined;
    }

    const voiceChannelId = this.voiceChannelId(guildId);

    return {
      state: player.paused ? "paused" : "playing",
      track: toPlayerCardTrack(track),
      positionMs: player.position,
      requestedByUserId: track.requestedByUserId,
      ...(voiceChannelId ? { voiceChannelId } : {}),
      queueSize: Math.max(0, queue.items.length - 1),
    };
  }

  private finishedView(guildId: string, reason: string): PlayerView {
    const last = this.lastTracks.get(guildId);

    return {
      state: "queueFinished",
      ...(last ? { track: toPlayerCardTrack(last) } : {}),
      positionMs: last?.durationMs ?? 0,
      queueSize: 0,
      reason,
    };
  }

  private disconnectedView(reason: string): PlayerView {
    return { state: "disconnected", positionMs: 0, queueSize: 0, reason };
  }

  /**
   * Disconnects every active voice connection and clears all in-memory state.
   * Called during graceful shutdown so Discord sees the bot leave immediately
   * instead of waiting for the voice session to time out. Uses allSettled so one
   * failing disconnect cannot prevent the others.
   */
  async shutdown(): Promise<void> {
    if (!this.shoukaku) {
      return;
    }

    const guildIds = [...this.shoukaku.players.keys()];

    await Promise.allSettled(
      guildIds.map((guildId) => this.getManager().leaveVoiceChannel(guildId)),
    );

    this.queues.clear();
    this.attachedPlayers.clear();
    this.lastTracks.clear();
    setActiveMusicQueues(0);
  }

  private getManager(): Shoukaku {
    if (!this.shoukaku) {
      throw new Error("Music service has not been initialized.");
    }

    return this.shoukaku;
  }

  private getOrCreateQueue(guildId: string): GuildQueue {
    const queue = this.queues.get(guildId);

    if (queue) {
      return queue;
    }

    const newQueue = new GuildQueue();
    this.queues.set(guildId, newQueue);
    setActiveMusicQueues(this.queues.size);

    return newQueue;
  }

  private async getOrCreatePlayer(input: JoinInput): Promise<Player> {
    const existingPlayer = this.getManager().players.get(input.guildId);

    if (existingPlayer) {
      return existingPlayer;
    }

    const player = await this.getManager().joinVoiceChannel({
      guildId: input.guildId,
      channelId: input.channelId,
      shardId: input.shardId,
      deaf: true,
    });

    this.attachPlayerEvents(player);

    return player;
  }

  private attachPlayerEvents(player: Player): void {
    if (this.attachedPlayers.has(player.guildId)) {
      return;
    }

    this.attachedPlayers.add(player.guildId);

    attachQueueAdvancement(player, {
      onAdvance: () => void this.handleTrackEnd(player.guildId),
      onException: recordPlaybackError,
    });
  }

  private async handleTrackEnd(guildId: string): Promise<void> {
    const queue = this.getQueue(guildId);

    if (!queue) {
      return;
    }

    queue.advance();

    if (queue.current) {
      await this.playCurrent(guildId);
      const view = this.activeView(guildId);
      if (view) {
        this.emit(guildId, view);
      }
    } else {
      this.emit(
        guildId,
        this.finishedView(guildId, "Playback finished — the queue is empty."),
      );
    }
  }

  private async playCurrent(guildId: string): Promise<void> {
    const queue = this.getQueue(guildId);
    const player = this.getManager().players.get(guildId);
    const track = queue?.current;

    if (!player || !track) {
      return;
    }

    await player.playTrack({
      track: { encoded: track.encoded },
    });

    this.lastTracks.set(guildId, track);
    recordTrackPlayed();
  }
}

export const musicService = new MusicService();
