import type { ButtonInteraction } from "discord.js";
import { musicService } from "../../modules/music/musicService.js";

export async function handleMusicControl(
  interaction: ButtonInteraction,
): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "Music controls can only be used in a server.",
      ephemeral: true,
    });
    return;
  }

  switch (interaction.customId) {
    case "music:pause": {
      const paused = await musicService.pause(interaction.guildId);
      await interaction.reply({
        content: paused ? "Playback paused." : "Nothing is playing.",
        ephemeral: true,
      });
      return;
    }
    case "music:resume": {
      const resumed = await musicService.resume(interaction.guildId);
      await interaction.reply({
        content: resumed ? "Playback resumed." : "Nothing is paused.",
        ephemeral: true,
      });
      return;
    }
    case "music:skip": {
      const skippedTrack = await musicService.skip(interaction.guildId);
      await interaction.reply({
        content: skippedTrack
          ? `Skipped **${skippedTrack.title}**.`
          : "Nothing is playing.",
        ephemeral: true,
      });
      return;
    }
    case "music:stop": {
      const stopped = await musicService.stop(interaction.guildId);
      await interaction.reply({
        content: stopped ? "Playback stopped and queue cleared." : "Nothing is playing.",
        ephemeral: true,
      });
      return;
    }
    default:
      return;
  }
}
