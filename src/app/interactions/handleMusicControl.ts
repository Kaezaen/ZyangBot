import { type ButtonInteraction, MessageFlags } from "discord.js";
import { logger } from "../../core/logger/index.js";
import { lyricsService } from "../../modules/music/lyricsService.js";
import { musicService } from "../../modules/music/musicService.js";
import { buildLyricsCard } from "../../ui/lyricsCard.js";

const QUEUE_PREVIEW_LIMIT = 15;

export async function handleMusicControl(
  interaction: ButtonInteraction,
): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "Music controls can only be used in a server.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const guildId = interaction.guildId;

  switch (interaction.customId) {
    case "music:pause":
      await runControl(interaction, () => musicService.pause(guildId), "Nothing is playing.");
      return;
    case "music:resume":
      await runControl(interaction, () => musicService.resume(guildId), "Nothing is paused.");
      return;
    case "music:skip":
      await runControl(
        interaction,
        async () => Boolean(await musicService.skip(guildId)),
        "Nothing is playing.",
      );
      return;
    case "music:stop":
      await runControl(interaction, () => musicService.stop(guildId), "Nothing is playing.");
      return;
    case "music:queue":
      await interaction.reply({
        content: renderQueuePreview(guildId),
        flags: MessageFlags.Ephemeral,
      });
      return;
    case "music:lyrics":
      await showLyrics(interaction, guildId);
      return;
    default:
      return;
  }
}

/** Shows the current track's lyrics as a private (ephemeral) Lyrics card. */
async function showLyrics(
  interaction: ButtonInteraction,
  guildId: string,
): Promise<void> {
  const track = musicService.getQueue(guildId)?.current;

  if (!track) {
    await interaction.reply({
      content: "Nothing is playing.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Fetching lyrics is a network call; acknowledge privately first.
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const lyrics = await lyricsService.findForTrack(track);

    if (!lyrics) {
      await interaction.editReply("No lyrics were found for the current track.");
      return;
    }

    await interaction.editReply(buildLyricsCard(track, lyrics));
  } catch (error) {
    logger.warn({ err: error, title: track.title }, "Lyrics lookup failed");
    await interaction.editReply("Could not load lyrics right now.");
  }
}

/**
 * Acknowledges the click immediately (within Discord's 3s window) so a slow
 * action can't expire the interaction, then runs it. On success the Player Card
 * re-renders itself via the MusicService update listener; on failure we send a
 * private follow-up.
 */
async function runControl(
  interaction: ButtonInteraction,
  action: () => Promise<boolean>,
  failureMessage: string,
): Promise<void> {
  await interaction.deferUpdate();

  if (!(await action())) {
    await interaction.followUp({
      content: failureMessage,
      flags: MessageFlags.Ephemeral,
    });
  }
}

function renderQueuePreview(guildId: string): string {
  const queue = musicService.getQueue(guildId);
  const current = queue?.current;
  // "Queue" means what plays next — the current track is already the card's focus.
  const upcoming = queue ? queue.items.slice(1) : [];

  if (!current) {
    return "Nothing is playing.";
  }

  const nowPlaying = `**Now playing**\n▶️ **${current.title}** — ${current.author}`;

  if (upcoming.length === 0) {
    return `${nowPlaying}\n\n**Up next**\nNothing is up next.`;
  }

  const shown = upcoming.slice(0, QUEUE_PREVIEW_LIMIT);
  const lines = shown.map(
    (track, index) => `${index + 1}. **${track.title}** — ${track.author}`,
  );

  if (upcoming.length > shown.length) {
    lines.push(`…and ${upcoming.length - shown.length} more`);
  }

  return `${nowPlaying}\n\n**Up next**\n${lines.join("\n")}`;
}
