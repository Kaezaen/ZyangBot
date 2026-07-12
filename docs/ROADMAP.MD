# ZyangBot Roadmap

> Status reflects the code on `main`. Update this file whenever a phase's
> reality changes — stale roadmaps cause duplicated work.

## Foundation (done)

- [x] Phase 1 — Environment, TypeScript (strict, ESM), Docker, Discord login
- [x] Phase 2 — Slash command deployment, `/ping`, interaction handler
- [x] Phase 3 — Command loader with automatic command discovery
- [x] Phase 4 — Music module, per-guild queue, voice via Shoukaku
- [x] Phase 5 — Lavalink integration
- [x] Phase 6 — Spotify (resolved through LavaSrc: Spotify URL → YouTube)
- [x] Phase 7 — Interactive player: embeds and control buttons
- [x] Phase 8 — Docker Compose stack (verified) and EC2 deploy artifacts

## Observability (partial)

- [x] Structured logging (Pino)
- [x] Metrics emission (Prometheus at `GET /metrics`)
- [ ] Metrics scraping + dashboards/alerting (nothing consumes `/metrics` yet)

## Production hardening (done)

- [x] Sprint 1 — Process safety: crash guards (unhandled rejection /
      uncaught exception), graceful SIGTERM/SIGINT shutdown, hardened
      interaction error fallback, single-source-of-truth queue advance
- [x] Sprint 2 — Deployment hardening: bot + Lavalink healthchecks with a
      `service_healthy` ordering gate, non-root container, memory limits and
      log rotation (plus fixes for the Docker build and Lavalink plugin volume)
- [x] Sprint 3 — Test foundation: `node:test` (no new deps), 31 tests over
      queue, duration formatting, track resolution, and the double-advance guard

## Backlog / next

- [ ] `/health` readiness endpoint (Discord-connected), vs the current
      liveness-only `/metrics` healthcheck
- [ ] Metrics scraping + dashboard (Prometheus/Grafana or CloudWatch)
- [ ] Handle `TrackStuckEvent` so a stuck track cannot freeze the queue
- [ ] Idle auto-leave when the queue drains
- [ ] Queue features: shuffle, loop, remove, move; `/queue` pagination + cap
- [ ] Same-voice-channel guard on control commands
- [ ] Migrate `ephemeral: true` → `flags: MessageFlags.Ephemeral`
- [ ] Broaden tests toward I/O paths (MusicService orchestration, shutdown)
