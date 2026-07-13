/**
 * Zyang Design Language colors (see docs/PLAYER_CARD_SPEC.md and
 * docs/DESIGN_SYSTEM.md). Every card uses these — do not introduce ad-hoc
 * colors, so screenshots stay recognizable as ZyangBot.
 */
export const Colors = {
  /** Player, Now Playing, general playback. */
  primary: 0x778873,
  /** Success / confirmation. */
  success: 0xa1bc98,
  /** Warnings and terminal-but-fine states (e.g. Queue Finished). */
  warning: 0xdccfc0,
  /** Errors — a soft, muted red (never bright red). */
  error: 0xe57373,
} as const;
