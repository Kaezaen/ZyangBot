import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { logger } from "../core/logger/index.js";
import { musicService } from "../modules/music/musicService.js";
import { formatDuration } from "../shared/formatDuration.js";

export const playCommand = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Plays a song, playlist, or Spotify URL.")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("A song name, URL, or Spotify URL.")
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({
        content: "Join a voice channel first.",
        ephemeral: true,
      });
      return;
    }

    const query = interaction.options.getString("query", true);
    await interaction.deferReply();

    try {
      const result = await musicService.enqueue({
        guildId: interaction.guild.id,
        channelId: voiceChannel.id,
        shardId: interaction.guild.shardId,
        query,
        requestedByUserId: interaction.user.id,
      });
      const firstTrack = result.addedTracks[0];

      if (!firstTrack) {
        throw new Error("Lavalink returned no playable tracks.");
      }

      const playbackMessage = result.startedPlayback
        ? `Now playing **${firstTrack.title}** — ${formatDuration(firstTrack.durationMs)}`
        : `Added **${firstTrack.title}** to the queue.`;
      const playlistMessage =
        result.addedTracks.length > 1
          ? ` Added ${result.addedTracks.length} tracks.`
          : "";

      await interaction.editReply(`${playbackMessage}${playlistMessage}`);
    } catch (error) {
      logger.error(
        { err: error, guildId: interaction.guild.id, query },
        "Failed to enqueue track",
      );
      await interaction.editReply(
        "I could not find or play that track. Please try another query.",
      );
    }
  },
};

export default playCommand;
