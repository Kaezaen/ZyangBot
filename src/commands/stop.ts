import {
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { musicService } from "../modules/music/musicService.js";

export const stopCommand = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stops playback and clears the queue."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const stopped = await musicService.stop(interaction.guildId);
    await interaction.reply({
      content: stopped ? "Stopped." : "Nothing is playing.",
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default stopCommand;
