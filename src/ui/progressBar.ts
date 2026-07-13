const FILLED = "▰";
const EMPTY = "▱";

/**
 * The ZyangBot progress bar: a clean filled/empty pill bar, e.g.
 * `▰▰▰▰▰▰▱▱▱▱▱▱`. The filled portion is proportional to playback position, so
 * it reads as progress at a glance. Reused by every card for consistency.
 *
 * Pure and snapshot-based: it renders the position at call time (it does not
 * tick on its own). For a smoother, colored bar Discord requires custom emojis
 * or a generated image — this is the native text-only version.
 */
export function renderProgressBar(
  positionMs: number,
  durationMs: number,
  length = 16,
): string {
  const total = Math.max(1, length);
  const ratio =
    durationMs <= 0 ? 0 : Math.min(1, Math.max(0, positionMs / durationMs));
  const filled = Math.round(ratio * total);

  return FILLED.repeat(filled) + EMPTY.repeat(total - filled);
}
