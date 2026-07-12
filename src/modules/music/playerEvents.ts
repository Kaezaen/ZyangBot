import { logger } from "../../core/logger/index.js";

export type TrackEndReason =
  | "finished"
  | "loadFailed"
  | "stopped"
  | "replaced"
  | "cleanup";

/**
 * Whether a track `end` event should advance the queue. Only natural completion
 * (`finished`) and a failed load (`loadFailed`) move to the next track;
 * `stopped`/`replaced`/`cleanup` are triggered by us (skip/stop) and are handled
 * by those callers, so advancing here would double-advance.
 */
export function shouldAdvanceOnEnd(reason: TrackEndReason): boolean {
  return reason === "finished" || reason === "loadFailed";
}

/**
 * Minimal structural view of the Shoukaku Player parts we consume. Kept narrow
 * so a fake emitter can drive it in tests without a live Lavalink node.
 */
export type PlayerEventSource = {
  guildId: string;
  on(
    event: "end",
    listener: (event: { reason: TrackEndReason }) => void,
  ): unknown;
  on(
    event: "exception",
    listener: (event: { exception: unknown }) => void,
  ): unknown;
};

export type QueueAdvancementHandlers = {
  onAdvance: () => void;
  /** Called after a player exception is logged (e.g. to record a metric). */
  onException?: () => void;
};

/**
 * Wires queue advancement to a player's lifecycle events.
 *
 * `end` is the single source of truth for advancing. `exception` only logs (and
 * notifies `onException`): a failed track ALSO emits `end` with reason
 * "loadFailed", so advancing on `exception` too would skip the following track
 * (double-advance). This separation is what the accompanying test locks in
 * place. Metrics are passed in as a callback so this module stays free of any
 * metrics/HTTP imports (which would otherwise load into the test process).
 */
export function attachQueueAdvancement(
  player: PlayerEventSource,
  handlers: QueueAdvancementHandlers,
): void {
  player.on("end", (event) => {
    if (shouldAdvanceOnEnd(event.reason)) {
      handlers.onAdvance();
    }
  });

  player.on("exception", (event) => {
    logger.error(
      { guildId: player.guildId, exception: event.exception },
      "Lavalink player exception",
    );
    handlers.onException?.();
  });
}
