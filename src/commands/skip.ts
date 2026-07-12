import {
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { musicService } from "../modules/music/musicService.js";

export const skipCommand = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skips the current track."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const skippedTrack = await musicService.skip(interaction.guildId);
    await interaction.reply({
      content: skippedTrack ? `Skipped **${skippedTrack.title}**.` : "Nothing is playing.",
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default skipCommand;
