import type { Client } from "discord.js";
import {
  Connectors,
  LoadType,
  type Player,
  Shoukaku,
  type Track as LavalinkTrack,
} from "shoukaku";
import { config } from "../../core/config/index.js";
import { logger } from "../../core/logger/index.js";
import { setActiveMusicQueues } from "../../services/metrics.js";
import { GuildQueue } from "./guildQueue.js";
import type { Track } from "./track.js";

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
    });

    this.shoukaku.on("error", (name, error) => {
      logger.error({ err: error, node: name }, "Lavalink node error");
    });

    this.shoukaku.on("close", (name, code, reason) => {
      logger.warn({ node: name, code, reason }, "Lavalink node disconnected");
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
    const resolvedTracks = this.toTracks(response?.loadType, response?.data, input);

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

    // `end` is the single source of truth for advancing the queue. Lavalink
    // emits it for every track that stops, and the reason tells us whether to
    // move on:
    //   - finished / loadFailed -> the track is done, play the next one
    //   - stopped / replaced / cleanup -> we triggered it (skip/stop), and that
    //     handler already manages the queue, so we must not advance here
    player.on("end", (event) => {
      if (event.reason === "finished" || event.reason === "loadFailed") {
        void this.handleTrackEnd(player.guildId);
      }
    });

    // `exception` is informational only. A failing track ALSO emits `end` with
    // reason "loadFailed", which is what advances the queue. Advancing here as
    // well would skip the following track (double-advance), so we only log.
    player.on("exception", (event) => {
      logger.error(
        { guildId: player.guildId, exception: event.exception },
        "Lavalink player exception",
      );
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
  }

  private toTracks(
    loadType: LoadType | undefined,
    data: unknown,
    input: EnqueueInput,
  ): Track[] {
    const lavalinkTracks = this.extractTracks(loadType, data);

    return lavalinkTracks.map((track) => ({
      encoded: track.encoded,
      title: track.info.title,
      author: track.info.author,
      durationMs: track.info.length,
      requestedByUserId: input.requestedByUserId,
      ...(track.info.uri ? { sourceUrl: track.info.uri } : {}),
    }));
  }

  private extractTracks(
    loadType: LoadType | undefined,
    data: unknown,
  ): LavalinkTrack[] {
    if (loadType === LoadType.TRACK && this.isTrack(data)) {
      return [data];
    }

    if (loadType === LoadType.SEARCH && Array.isArray(data)) {
      return data.filter(this.isTrack);
    }

    if (loadType === LoadType.PLAYLIST && this.isPlaylist(data)) {
      return data.tracks;
    }

    return [];
  }

  private isTrack(value: unknown): value is LavalinkTrack {
    return (
      typeof value === "object" &&
      value !== null &&
      "encoded" in value &&
      "info" in value
    );
  }

  private isPlaylist(value: unknown): value is { tracks: LavalinkTrack[] } {
    return (
      typeof value === "object" &&
      value !== null &&
      "tracks" in value &&
      Array.isArray(value.tracks) &&
      value.tracks.every(this.isTrack)
    );
  }
}

export const musicService = new MusicService();
