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
import { GuildQueue } from "./guildQueue.js";
import { attachQueueAdvancement } from "./playerEvents.js";
import type { Track } from "./track.js";
import { toTracks } from "./trackResolver.js";

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

export class MusicService {
  private readonly queues = new Map<string, GuildQueue>();
  private readonly attachedPlayers = new Set<string>();
  private shoukaku: Shoukaku | undefined;
  private lavalinkConnected = false;

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

    return true;
  }

  async enqueue(input: EnqueueInput): Promise<EnqueueResult> {
    const node = this.getManager().getIdealNode();

    if (!node) {
      throw new Error("No Lavalink node is available.");
    }

    const response = await node.rest.resolve(input.query);
    const resolvedTracks = toTracks(
      response?.loadType,
      response?.data,
      input.requestedByUserId,
    );

    if (resolvedTracks.length === 0) {
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
    return true;
  }

  async resume(guildId: string): Promise<boolean> {
    const player = this.getManager().players.get(guildId);

    if (!player || !this.getQueue(guildId)?.current || !player.paused) {
      return false;
    }

    await player.setPaused(false);
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
    } else {
      await player.stopTrack();
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

    recordTrackPlayed();
  }
}

export const musicService = new MusicService();
