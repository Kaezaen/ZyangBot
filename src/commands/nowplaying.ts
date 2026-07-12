import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { musicService } from "../modules/music/musicService.js";
import { formatDuration } from "../shared/formatDuration.js";

export const nowPlayingCommand = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Shows the current track and playback controls."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
      return;
    }

    const track = musicService.getQueue(interaction.guildId)?.current;

    if (!track) {
      await interaction.reply("Nothing is playing.");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Now playing")
      .setDescription(`**${track.title}**`)
      .addFields(
        { name: "Artist", value: track.author || "Unknown", inline: true },
        { name: "Duration", value: formatDuration(track.durationMs), inline: true },
        {
          name: "Status",
          value: musicService.isPaused(interaction.guildId) ? "Paused" : "Playing",
          inline: true,
        },
      );

    if (track.sourceUrl) {
      embed.setURL(track.sourceUrl);
    }

    const controls = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("music:pause")
        .setLabel("Pause")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("music:resume")
        .setLabel("Resume")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("music:skip")
        .setLabel("Skip")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("music:stop")
        .setLabel("Stop")
        .setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({ embeds: [embed], components: [controls] });
  },
};

export default nowPlayingCommand;
