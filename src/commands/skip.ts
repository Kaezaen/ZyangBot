import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { musicService } from "../modules/music/musicService.js";

export const skipCommand = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skips the current track."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const skippedTrack = await musicService.skip(interaction.guildId);
    await interaction.reply(
      skippedTrack ? `Skipped **${skippedTrack.title}**.` : "Nothing is playing.",
    );
  },
};

export default skipCommand;
