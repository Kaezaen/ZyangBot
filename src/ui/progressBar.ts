const LINE = "━";
const KNOB = "◉";

/**
 * The ZyangBot signature progress bar: a clean line with a single knob marking
 * the current position, e.g. `━━━━━━━━━━━━◉━━━━━━`. This is the one and only
 * progress-bar style — reused by every card so it stays recognizable.
 *
 * Pure and snapshot-based: it renders the position at call time (it does not
 * tick on its own).
 */
export function renderProgressBar(
  positionMs: number,
  durationMs: number,
  length = 18,
): string {
  const total = Math.max(1, length);

  // Unknown/zero duration (e.g. live streams): show the knob at the start.
  if (durationMs <= 0) {
    return KNOB + LINE.repeat(total - 1);
  }

  const ratio = Math.min(1, Math.max(0, positionMs / durationMs));
  const knobIndex = Math.round(ratio * (total - 1));

  return LINE.repeat(knobIndex) + KNOB + LINE.repeat(total - 1 - knobIndex);
}
