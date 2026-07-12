import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production"])
    .default("development"),

  DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is required"),

  CLIENT_ID: z
    .string()
    .regex(/^\d{17,20}$/, "CLIENT_ID must be a Discord application ID"),

  GUILD_ID: z
    .string()
    .regex(/^\d{17,20}$/, "GUILD_ID must be a Discord server ID"),

  LAVALINK_URL: z.string().min(1).default("localhost:2333"),

  LAVALINK_PASSWORD: z.string().min(1, "LAVALINK_PASSWORD is required"),

  LAVALINK_NAME: z.string().min(1).default("local"),

  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error", "fatal"])
    .default("info"),

  METRICS_PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
});

export type Env = z.infer<typeof envSchema>;
