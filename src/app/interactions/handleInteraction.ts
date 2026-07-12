import type { ChatInputCommandInteraction, Interaction } from "discord.js";
import { commandsByName } from "../../commands/index.js";
import { logger } from "../../core/logger/index.js";
import {
  recordCommandError,
  recordCommandInteraction,
  startCommandTimer,
} from "../../services/metrics.js";
import { handleMusicControl } from "./handleMusicControl.js";

export async function handleInteraction(interaction: Interaction): Promise<void> {
  if (interaction.isButton() && interaction.customId.startsWith("music:")) {
    await handleMusicControl(interaction);
    return;
  }

  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commandsByName.get(interaction.commandName);

  if (!command) {
    return;
  }

  recordCommandInteraction(interaction.commandName);
  const stopTimer = startCommandTimer(interaction.commandName);

  try {
    await command.execute(interaction);
  } catch (error) {
    recordCommandError(interaction.commandName);
    logger.error(
      { err: error, command: interaction.commandName, guildId: interaction.guildId },
      "Command execution failed",
    );

    await reportCommandFailure(interaction);
  } finally {
    stopTimer();
  }
}

/**
 * Best-effort notification that a command failed. The reply itself is a network
 * call to Discord that can throw (expired interaction token, already
 * acknowledged, ...). If it does, we log and swallow: failing to report an error
 * must never escalate into an unhandled rejection that crashes the process.
 */
async function reportCommandFailure(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const message = "Something went wrong while running that command.";

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(message);
      return;
    }

    await interaction.reply({ content: message, ephemeral: true });
  } catch (error) {
    logger.error(
      { err: error, command: interaction.commandName, guildId: interaction.guildId },
      "Failed to deliver command-failure notice to the user",
    );
  }
}
