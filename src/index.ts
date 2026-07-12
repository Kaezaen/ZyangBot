import { Events } from "discord.js";
import { client } from "./app/client/ZyangClient.js";
import { handleInteraction } from "./app/interactions/handleInteraction.js";
import { config } from "./core/config/index.js";
import { logger } from "./core/logger/index.js";
import {
  registerCrashGuards,
  registerShutdownHandlers,
} from "./core/process/index.js";
import { musicService } from "./modules/music/musicService.js";
import { playerCardManager } from "./modules/music/playerCardManager.js";
import { startMetricsServer, stopMetricsServer } from "./services/metrics.js";

registerCrashGuards();

client.once(Events.ClientReady, (readyClient) => {
  logger.info({ user: readyClient.user.tag }, "Logged in");
});

client.on(Events.InteractionCreate, handleInteraction);

musicService.initialize(client);
playerCardManager.attach(client);
musicService.onPlayerUpdate((update) => playerCardManager.handleUpdate(update));
startMetricsServer(config.metricsPort, () => ({
  discord: client.isReady(),
  lavalink: musicService.isLavalinkConnected(),
}));

registerShutdownHandlers(async () => {
  // Stop accepting new work, then tear down from the outside in: voice
  // connections, the metrics server, and finally the Discord gateway.
  client.off(Events.InteractionCreate, handleInteraction);
  await musicService.shutdown();
  await stopMetricsServer();
  await client.destroy();
});

await client.login(config.discord.token);
