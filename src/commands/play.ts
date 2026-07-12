import {
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { logger } from "../core/logger/index.js";
import { musicService } from "../modules/music/musicService.js";
import { playerCardManager } from "../modules/music/playerCardManager.js";

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
    if (!interaction.guild || !interaction.channelId) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({
        content: "Join a voice channel first.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const query = interaction.options.getString("query", true);

    // The Player Card is the UI: acknowledge privately, then let the card speak.
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // The card lives in the channel where /play was invoked.
    playerCardManager.bind(interaction.guild.id, interaction.channelId);

    try {
      await musicService.enqueue({
        guildId: interaction.guild.id,
        channelId: voiceChannel.id,
        shardId: interaction.guild.shardId,
        query,
        requestedByUserId: interaction.user.id,
      });

      // Remove the private ack; the persistent Player Card is the response.
      await interaction.deleteReply();
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
