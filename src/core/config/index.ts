import "dotenv/config";

import { envSchema } from "./schema.js";

function loadConfig() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables");
    console.error(parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}

const env = loadConfig();

export const config = {
  env: env.NODE_ENV,

  discord: {
    token: env.DISCORD_TOKEN,
    clientId: env.CLIENT_ID,
    guildId: env.GUILD_ID,
  },

  lavalink: {
    name: env.LAVALINK_NAME,
    url: env.LAVALINK_URL,
    password: env.LAVALINK_PASSWORD,
  },

  logLevel: env.LOG_LEVEL,

  metricsPort: env.METRICS_PORT,
} as const;
