import type { EmbedBuilder } from "discord.js";
import { buildCardEmbed } from "./card.js";
import { Colors } from "./colors.js";

// Discord embed descriptions cap at 4096 chars; leave room for the notice.
const MAX_LYRICS = 3900;

export type LyricsCardTrack = { title: string; author: string };

/**
 * Builds the Lyrics card (an embed) for a track, reusing the shared card
 * grammar. Pure — no I/O. Long lyrics are truncated to fit the embed limit.
 */
export function buildLyricsCard(
  track: LyricsCardTrack,
  lyrics: string,
): { embeds: EmbedBuilder[] } {
  const trimmed = lyrics.trim();
  const body =
    trimmed.length > MAX_LYRICS
      ? `${trimmed.slice(0, MAX_LYRICS)}\n\n… (lyrics truncated)`
      : trimmed;

  const embed = buildCardEmbed({
    color: Colors.primary,
    author: { name: "Lyrics" },
    title: `${track.title} — ${track.author}`,
    description: body,
    footer: "Source: lrclib",
  });

  return { embeds: [embed] };
}
