# ZyangBot — Session Handoff

> Read this to continue development in a fresh session/window. Runtime is
> **Docker only**. Repo: `github.com/Kaezaen/ZyangBot`, branch `main`, author
> email `m.adityapratama0202@gmail.com` (already configured; commits attribute
> correctly). End commit messages with the Claude co-author trailer.

## How to run (Docker only — do NOT use `pnpm dev`)

- Start whole stack: `docker compose --profile observability up -d`
- Stop: `docker compose --profile observability down`
- Rebuild bot after a code change: `docker compose --profile observability up -d --build bot`
- Register/refresh slash commands (after adding, renaming, or changing options
  of a command): `corepack pnpm deploy:commands`
- Logs: `docker compose logs bot` / `docker compose logs lavalink`
- Tests: `corepack pnpm test` (node:test, no deps). Typecheck: `corepack pnpm typecheck`.
- Fresh clone on host: `corepack pnpm install --ignore-scripts` (pnpm v10+ blocks
  esbuild's build script otherwise; Docker build already uses this flag).
- The bot is **ZyangBot#3787**. Run exactly one instance — running `pnpm dev`
  alongside the Docker bot causes a Discord token conflict.

## What is built (all on `main`)

- **Sprint 1** — process safety: crash guards, graceful shutdown, single-source
  queue advance.
- **Sprint 2** — deployment hardening: healthchecks + `service_healthy` gate,
  non-root container, memory limits, log rotation. Fixed the Docker build
  (`--ignore-scripts`) and dropped the Lavalink plugin volume.
- **Sprint 3** — `node:test` foundation (no new deps).
- **Sprint 4** — docs aligned with reality, repo hygiene.
- **Sprint 5** — observability: enriched Prometheus metrics, `/health` readiness
  (the bot's Docker healthcheck), optional `observability` compose profile
  (Prometheus + Grafana, off by default).
- **Sprint 6** — persistent **Player Card**: `src/ui/` layout grammar + card
  builders, `PlayerCardManager` (one card per guild, edited in place). Source of
  truth: `docs/PLAYER_CARD_SPEC.md`.
- **Sprint 7** — direct title search (`normalizeQuery` → `ytsearch:`) and Spotify
  URL passthrough; search queues only the top result.

## Architecture (see `docs/ARCHITECTURE.md`)

Commands/buttons → `MusicService` (business, `src/modules/music`) → Shoukaku →
Lavalink. Presentation is pure in `src/ui/` (`card.ts` grammar, `colors.ts`,
`progressBar.ts`, `playerCard.ts`). `MusicService.onPlayerUpdate` emits a
`PlayerView`; `PlayerCardManager` renders/edits the single card message.

## Config & secrets (`.env`, gitignored)

Required: `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`, `LAVALINK_PASSWORD`.
Set: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` (single tracks work).
`LAVALINK_URL=lavalink:2333` in Docker. Never commit `.env`.

## Key decisions & gotchas

- **Spotify PLAYLISTS do not work** (HTTP 401). A newly-created Spotify app
  cannot read playlists: the anonymous-token path is TOTP-protected (LavaSrc's
  default endpoint returns 401) and client credentials are rejected for
  playlists. The real fix is `customTokenEndpoint` (a fragile external token
  service) — **deferred**. Single Spotify tracks, YouTube (incl. YouTube
  playlists), and title search all work. LavaSrc is pinned to **4.8.3**.
- **`sp_dc` cookie** unlocks **Spotify synced lyrics** (NOT playlists) — relevant
  to the lyrics feature below, not to playback.
- **Player Card design** follows `PLAYER_CARD_SPEC.md` within Discord embed
  limits (embeds are not CSS: no pixel padding/fonts/sizes). Header is plain
  "Now Playing" (no emoji, per spec). First button green (`Success`), the rest
  `Secondary`. Colors live in `src/ui/colors.ts`.
- **Pending UI decision** — button icons: (A) text labels [current], (B) unicode
  symbols, (C) custom Lucide emojis (needs emojis uploaded to the Discord server
  to match the mockup exactly).
- **Orphan container** `zyangbot-lavalink` (from an old run) can be removed:
  `docker rm -f zyangbot-lavalink`.

## CURRENT TASK — Lyrics feature 🎤

Goal: let users view lyrics for the current track. Differentiator vs other bots:
synced / real-time lyrics.

Existing pieces:
- `src/modules/music/lyricsService.ts` — queries `lrclib.net`, returns
  `plainLyrics` and `syncedLyrics` (LRC with timestamps).
- `/lyrics` command shows plain text today.
- The **Lyrics button** on the Player Card is a **disabled placeholder**
  (`PlayerButtonId.lyrics` in `src/ui/playerCard.ts`).

Proposed plan (confirm with the user before building):
- **Phase 1 (basic):** enable the Lyrics button → fetch current-track lyrics via
  `lyricsService` → present as a **Lyrics Card** reusing the `src/ui` card
  grammar (new `src/ui/lyricsCard.ts`) or an ephemeral message. Keep business
  logic in `MusicService`/`lyricsService`, presentation in `src/ui`.
- **Phase 2 (differentiator, synced):** a Lyrics Card that highlights the current
  line from `syncedLyrics` using `player.position`, refreshed on a timer (edit
  the message every ~2-3s to respect rate limits). Optionally add Spotify synced
  lyrics via the `sp_dc` cookie (`spotify.spDc` in `lavalink/application.yml`,
  fed from a new `.env` var).

Open questions for the user: Phase 1 only or go straight to synced (Phase 2)?
Lyrics as its own card vs ephemeral? Button-icon choice (A/B/C)?
