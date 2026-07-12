import { createServer, type Server } from "node:http";
import {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from "prom-client";
import { logger } from "../core/logger/index.js";

const registry = new Registry();

collectDefaultMetrics({ register: registry });

const commandInteractions = new Counter({
  name: "zyangbot_command_interactions_total",
  help: "Total slash command interactions handled by the bot.",
  labelNames: ["command"] as const,
  registers: [registry],
});

const commandErrors = new Counter({
  name: "zyangbot_command_errors_total",
  help: "Slash command executions that threw an error.",
  labelNames: ["command"] as const,
  registers: [registry],
});

const commandDuration = new Histogram({
  name: "zyangbot_command_duration_seconds",
  help: "Slash command execution time in seconds.",
  labelNames: ["command"] as const,
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

const tracksPlayed = new Counter({
  name: "zyangbot_tracks_played_total",
  help: "Total tracks that started playback.",
  registers: [registry],
});

const playbackErrors = new Counter({
  name: "zyangbot_playback_errors_total",
  help: "Total Lavalink player exceptions.",
  registers: [registry],
});

const activeMusicQueues = new Gauge({
  name: "zyangbot_active_music_queues",
  help: "Number of guilds with an active music queue.",
  registers: [registry],
});

const lavalinkConnected = new Gauge({
  name: "zyangbot_lavalink_connected",
  help: "Whether a Lavalink node is currently connected (1) or not (0).",
  registers: [registry],
});

export function recordCommandInteraction(command: string): void {
  commandInteractions.inc({ command });
}

export function recordCommandError(command: string): void {
  commandErrors.inc({ command });
}

/** Starts a timer; call the returned function when the command finishes. */
export function startCommandTimer(command: string): () => void {
  return commandDuration.startTimer({ command });
}

export function recordTrackPlayed(): void {
  tracksPlayed.inc();
}

export function recordPlaybackError(): void {
  playbackErrors.inc();
}

export function setActiveMusicQueues(count: number): void {
  activeMusicQueues.set(count);
}

export function setLavalinkConnected(connected: boolean): void {
  lavalinkConnected.set(connected ? 1 : 0);
}

let server: Server | undefined;

/** Reports whether the bot's upstream connections are ready. */
export type HealthCheck = () => { discord: boolean; lavalink: boolean };

export function startMetricsServer(port: number, health?: HealthCheck): void {
  server = createServer(async (request, response) => {
    if (request.url === "/health") {
      const status = health?.() ?? { discord: false, lavalink: false };
      const ready = status.discord && status.lavalink;

      response.writeHead(ready ? 200 : 503, {
        "Content-Type": "application/json",
      });
      response.end(
        JSON.stringify({ status: ready ? "ok" : "unavailable", ...status }),
      );
      return;
    }

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
