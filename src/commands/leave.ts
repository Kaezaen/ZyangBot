import {
  type ChatInputCommandInteraction,
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
        ephemeral: true,
      });
      return;
    }

    const leftVoiceChannel = await musicService.leave(interaction.guildId);

    await interaction.reply(
      leftVoiceChannel
        ? "Left the voice channel."
        : "I am not connected to a voice channel.",
    );
  },
};

export default leaveCommand;
