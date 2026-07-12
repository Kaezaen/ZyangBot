# Architecture

## Request flow

```
Discord User
      │
      ▼
Slash Command / Button
      │
      ▼
InteractionCreate  ──►  handleInteraction        (src/app/interactions)
      │                    │
      │                    ├─ chat command ─►  commands/<name>.ts
      │                    └─ music button ─►  handleMusicControl
      │                                            │
      ▼                                            ▼
                                        MusicService  (modules/music)
                                              │
                                              ▼
                                     Shoukaku ──► Lavalink node
                                              │
                                              ▼
                                        Voice Channel
```

Commands never talk to Lavalink directly. Every music operation goes through
`MusicService`, which owns the single Shoukaku manager and one `GuildQueue`
per guild.

## Layers (single responsibility per file)

- `src/index.ts` — composition root: wires the client, interaction handler,
  music service, metrics server, crash guards, and graceful shutdown.
- `src/app/`
  - `client/ZyangClient.ts` — the Discord client (intents only).
  - `interactions/` — routing: `handleInteraction` (commands) and
    `handleMusicControl` (buttons).
- `src/commands/` — one file per slash command; `index.ts` auto-discovers and
  validates them. `deploy-commands.ts` registers command metadata with Discord
  (a separate process from running the bot).
- `src/core/`
  - `config/` — Zod-validated environment, fail-fast on boot.
  - `logger/` — Pino instance.
  - `process/` — crash guards (unhandled rejection / uncaught exception) and
    graceful SIGTERM/SIGINT shutdown.
- `src/services/metrics.ts` — Prometheus registry and the `/metrics` HTTP
  server.
- `src/modules/music/`
  - `musicService.ts` — orchestration: players, queues, playback lifecycle.
  - `guildQueue.ts` — per-guild FIFO queue (pure).
  - `track.ts` — internal track shape.
  - `trackResolver.ts` — pure Lavalink-response → `Track` parsing.
  - `playerEvents.ts` — pure queue-advance decision + player-event wiring.
  - `lyricsService.ts` — lyrics lookup (lrclib).
- `src/shared/` — small pure helpers (e.g. `formatDuration`).

## Key invariants

- **Single source of truth for queue advance.** Only the player `end` event
  advances the queue (on `finished`/`loadFailed`); `exception` is log-only, so
  a failed track is not skipped twice. Locked by `playerEvents.test.ts`.
- **Fail predictably.** Config validation exits on boot if the environment is
  invalid; process-level guards keep one bad interaction from crashing the bot;
  shutdown disconnects voice and closes the metrics server before exit.
- **Deploy vs. run are separate.** `deploy-commands.ts` registers commands;
  `index.ts` runs the bot. Re-run `pnpm deploy:commands` after changing a
  command's name or options.

## Testing

Pure logic is covered by `node:test` (run `pnpm test`): `GuildQueue`,
`formatDuration`, `trackResolver`, and the double-advance guard in
`playerEvents`. I/O-heavy paths (orchestration, shutdown, Discord/Lavalink) are
not yet unit-tested.
