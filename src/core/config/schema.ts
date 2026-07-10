import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production"])
    .default("development"),

  DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is required"),

  CLIENT_ID: z.string().min(1, "CLIENT_ID is required"),

  GUILD_ID: z.string().min(1, "GUILD_ID is required"),
});

export type Env = z.infer<typeof envSchema>;