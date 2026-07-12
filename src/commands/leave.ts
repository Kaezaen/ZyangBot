import {
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { musicService } from "../modules/music/musicService.js";

export const leaveCommand = {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Leaves the current voice channel."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const leftVoiceChannel = await musicService.leave(interaction.guildId);
    await interaction.reply({
      content: leftVoiceChannel
        ? "Left the voice channel."
        : "I am not connected to a voice channel.",
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default leaveCommand;
