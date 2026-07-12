import { createServer, type Server } from "node:http";
import { Counter, Gauge, Registry, collectDefaultMetrics } from "prom-client";
import { logger } from "../core/logger/index.js";

const registry = new Registry();

collectDefaultMetrics({ register: registry });

const commandInteractions = new Counter({
  name: "zyangbot_command_interactions_total",
  help: "Total slash command interactions handled by the bot.",
  labelNames: ["command"] as const,
  registers: [registry],
});

const activeMusicQueues = new Gauge({
  name: "zyangbot_active_music_queues",
  help: "Number of guilds with an active music queue.",
  registers: [registry],
});

export function recordCommandInteraction(command: string): void {
  commandInteractions.inc({ command });
}

export function setActiveMusicQueues(count: number): void {
  activeMusicQueues.set(count);
}

let server: Server | undefined;

export function startMetricsServer(port: number): void {
  server = createServer(async (request, response) => {
    if (request.url !== "/metrics") {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "Content-Type": registry.contentType });
    response.end(await registry.metrics());
  });

  server.on("error", (error) => {
    logger.error({ err: error, port }, "Metrics server failed");
  });

  server.listen(port, "0.0.0.0", () => {
    logger.info({ port }, "Metrics server listening");
  });
}

/**
 * Closes the metrics server so the process can exit cleanly. Resolves even if no
 * server was started, so shutdown callers do not need to know the startup order.
 */
export function stopMetricsServer(): Promise<void> {
  return new Promise((resolve) => {
    if (!server) {
      resolve();
      return;
    }

    server.close(() => {
      server = undefined;
      resolve();
    });
  });
}
