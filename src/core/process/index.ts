import { logger } from "../logger/index.js";

/**
 * Hard ceiling on cleanup time. Docker sends SIGKILL ~10s after SIGTERM, so we
 * force our own exit before that to keep the shutdown outcome predictable rather
 * than being killed mid-cleanup.
 */
const SHUTDOWN_TIMEOUT_MS = 8_000;

/**
 * Installs process-level safety nets.
 *
 * These are the last line of defence for async errors that escape every local
 * try/catch (Shoukaku node events, detached `void promise` callbacks, timers,
 * ...). Without them, Node 22 terminates the process on the first unhandled
 * rejection — one missing `.catch` anywhere would take the bot down for every
 * guild.
 */
export function registerCrashGuards(): void {
  // An unhandled rejection is almost always a recoverable async op missing a
  // `.catch` (a failed Discord edit, a flaky HTTP call). We log it loudly so the
  // real bug gets fixed, but we do NOT exit: staying alive for every other guild
  // is the whole point of this sprint.
  process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "Unhandled promise rejection");
  });

  // An uncaught *synchronous* exception leaves the process in an undefined state
  // (Node makes no guarantees about event-loop invariants afterwards). Resuming
  // is unsafe, so we log fatal and exit non-zero — Docker's `restart:
  // unless-stopped` then brings up a clean process. A clean restart beats a
  // zombie.
  process.on("uncaughtException", (error) => {
    logger.fatal({ err: error }, "Uncaught exception, exiting");
    process.exit(1);
  });
}

/**
 * Runs `cleanup` on SIGTERM/SIGINT, then exits.
 *
 * - Deduplicates signals: a second SIGTERM while shutting down is ignored, not
 *   run twice.
 * - Enforces a timeout so hung cleanup cannot leave the process alive past
 *   Docker's SIGKILL grace period.
 */
export function registerShutdownHandlers(
  cleanup: () => Promise<void>,
): void {
  let shuttingDown = false;

  const run = (signal: NodeJS.Signals): void => {
    if (shuttingDown) {
      logger.warn({ signal }, "Shutdown already in progress, ignoring signal");
      return;
    }

    shuttingDown = true;
    logger.info({ signal }, "Received shutdown signal, cleaning up");

    const watchdog = setTimeout(() => {
      logger.error("Graceful shutdown timed out, forcing exit");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    watchdog.unref();

    cleanup()
      .then(() => {
        logger.info("Shutdown complete");
        process.exit(0);
      })
      .catch((error: unknown) => {
        logger.error({ err: error }, "Error during shutdown");
        process.exit(1);
      });
  };

  process.on("SIGTERM", () => run("SIGTERM"));
  process.on("SIGINT", () => run("SIGINT"));
}
