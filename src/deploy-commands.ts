import { REST, Routes } from "discord.js";
import { commands } from "./commands/index.js";
import { config } from "./core/config/index.js";

const rest = new REST({ version: "10" }).setToken(config.discord.token);

try {
  await rest.put(
    Routes.applicationGuildCommands(
      config.discord.clientId,
      config.discord.guildId,
    ),
    { body: commands.map((command) => command.data.toJSON()) },
  );

  console.log(`Successfully deployed ${commands.length} command(s).`);
} catch (error) {
  console.error("Failed to deploy slash commands.", error);
  process.exitCode = 1;
}
