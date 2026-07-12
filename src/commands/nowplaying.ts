import {
  type ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { musicService } from "../modules/music/musicService.js";
import { playerCardManager } from "../modules/music/playerCardManager.js";

export const nowPlayingCommand = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Re-shows the Player Card in this channel."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId || !interaction.channelId) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Move/refresh the single Player Card into this channel.
    playerCardManager.bind(interaction.guildId, interaction.channelId);
    const refreshed = musicService.refresh(interaction.guildId);

    await interaction.reply({
      content: refreshed ? "Player Card refreshed." : "Nothing is playing.",
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default nowPlayingCommand;
