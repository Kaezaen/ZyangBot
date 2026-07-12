import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { musicService } from "../modules/music/musicService.js";

export const pauseCommand = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pauses the current track."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const paused = await musicService.pause(interaction.guildId);
    await interaction.reply(paused ? "Playback paused." : "Nothing is playing.");
  },
};

export default pauseCommand;
