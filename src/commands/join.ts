import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { musicService } from "../modules/music/musicService.js";

export const joinCommand = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Joins your voice channel."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guild) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({
        content: "Join a voice channel first.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    try {
      await musicService.join({
        guildId: interaction.guild.id,
        channelId: voiceChannel.id,
        shardId: interaction.guild.shardId,
      });

      await interaction.editReply(`Joined ${voiceChannel}.`);
    } catch (error) {
      console.error("Failed to join the voice channel.", error);
      await interaction.editReply("I could not join that voice channel.");
    }
  },
};

export default joinCommand;
