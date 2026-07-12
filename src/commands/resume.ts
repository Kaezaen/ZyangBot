import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { musicService } from "../modules/music/musicService.js";

export const resumeCommand = {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Resumes the current track."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const resumed = await musicService.resume(interaction.guildId);
    await interaction.reply(resumed ? "Playback resumed." : "Nothing is paused.");
  },
};

export default resumeCommand;
