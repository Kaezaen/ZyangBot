import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { musicService } from "../modules/music/musicService.js";

export const queueCommand = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Shows the current music queue."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    const queue = musicService.getQueue(interaction.guildId);

    if (!queue || queue.isEmpty) {
      await interaction.reply("The queue is empty.");
      return;
    }

    const tracks = queue.items
      .map((track, index) => {
        const prefix = index === 0 ? "▶️" : `${index}.`;
        return `${prefix} **${track.title}** — ${track.author}`;
      })
      .join("\n");

    await interaction.reply(`**Music queue**\n${tracks}`);
  },
};

export default queueCommand;
