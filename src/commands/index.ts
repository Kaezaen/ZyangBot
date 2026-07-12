import { readdir } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

type Command = {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

function isCommand(value: unknown): value is Command {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    "execute" in value &&
    typeof value.execute === "function"
  );
}

const commandDirectory = dirname(fileURLToPath(import.meta.url));
const loaderFileName = basename(fileURLToPath(import.meta.url));

const commandFiles = (await readdir(commandDirectory))
  .filter((fileName) => {
    const extension = extname(fileName);

    return (
      fileName !== loaderFileName &&
      !fileName.endsWith(".d.ts") &&
      [".js", ".ts"].includes(extension)
    );
  })
  .sort();

export const commands = await Promise.all(
  commandFiles.map(async (fileName) => {
    const moduleUrl = pathToFileURL(join(commandDirectory, fileName)).href;
    const commandModule = await import(moduleUrl);

    if (!isCommand(commandModule.default)) {
      throw new Error(
        `Command file "${fileName}" must default export a command with data and execute.`,
      );
    }

    return commandModule.default;
  }),
);

const commandNames = commands.map((command) => command.data.name);

if (new Set(commandNames).size !== commandNames.length) {
  throw new Error("Each command must have a unique slash command name.");
}

export const commandsByName = new Map(
  commands.map((command) => [command.data.name, command]),
);
