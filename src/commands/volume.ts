import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { musicService } from "../modules/music/musicService.js";

export const volumeCommand = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Sets the playback volume.")
    .addIntegerOption((option) =>
      option
        .setName("level")
        .setDescription("Volume from 0 to 200.")
        .setMinValue(0)
        .setMaxValue(200)
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const volume = interaction.options.getInteger("level", true);
    const updated = await musicService.setVolume(interaction.guildId, volume);
    await interaction.reply(updated ? `Volume set to ${volume}%.` : "Nothing is playing.");
  },
};

export default volumeCommand;
