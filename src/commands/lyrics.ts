import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { logger } from "../core/logger/index.js";
import { lyricsService } from "../modules/music/lyricsService.js";
import { musicService } from "../modules/music/musicService.js";

const maxLyricsLength = 1_850;

export const lyricsCommand = {
  data: new SlashCommandBuilder()
    .setName("lyrics")
    .setDescription("Shows lyrics for the current track."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const track = musicService.getQueue(interaction.guildId)?.current;

    if (!track) {
      await interaction.reply("Nothing is playing.");
      return;
    }

    await interaction.deferReply();

    try {
      const lyrics = await lyricsService.findForTrack(track);

      if (!lyrics) {
        await interaction.editReply("Lyrics were not found for the current track.");
        return;
      }

      const message =
        lyrics.length > maxLyricsLength
          ? `${lyrics.slice(0, maxLyricsLength)}\n\nLyrics truncated.`
          : lyrics;

      await interaction.editReply(`**${track.title}**\n${message}`);
    } catch (error) {
      logger.warn({ err: error, title: track.title }, "Lyrics lookup failed");
      await interaction.editReply("Lyrics could not be loaded right now.");
    }
  },
};

export default lyricsCommand;
