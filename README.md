# ZyangBot

ZyangBot is a TypeScript Discord music bot using Discord.js, Lavalink, and
Docker. Slash commands are auto-discovered from `src/commands`.

## Features

- Guild slash commands with a shared command loader.
- `/play` for song names, URLs, playlists, and Spotify URLs through LavaSrc.
- Per-guild queues, pause, resume, skip, stop, volume, and now-playing controls.
- Voice join and leave managed by Lavalink through Shoukaku.
- `/lyrics` for the currently playing track.
- Pino logs and Prometheus metrics at `GET /metrics`.

## Local setup

1. Copy `.env.example` to `.env`.
2. Fill Discord credentials and a strong `LAVALINK_PASSWORD`.
3. Optionally add Spotify client credentials to enable Spotify URL resolution.
4. Start the full stack:

   ```bash
   docker compose up --build
   ```

5. Register slash commands after the bot starts:

   ```bash
   corepack pnpm deploy:commands
   ```

For host-based development, install dependencies, start Lavalink separately,
set `LAVALINK_URL=localhost:2333`, then run `corepack pnpm dev`:

```bash
corepack pnpm install --ignore-scripts
```

> `--ignore-scripts` is needed on a fresh clone: pnpm v10+ otherwise
> hard-fails the install on esbuild's (a `tsx` dependency) un-approved build
> script. esbuild ships its binary via an optional dependency, so skipping
> scripts is safe. Alternatively run `corepack pnpm approve-builds` once.

## Commands

`/play`, `/queue`, `/nowplaying`, `/pause`, `/resume`, `/skip`, `/stop`,
`/volume`, `/lyrics`, `/join`, `/leave`, and `/ping`.

## Operations

- Build: `corepack pnpm build`
- Typecheck: `corepack pnpm typecheck`
- Test: `corepack pnpm test`
- Metrics: `http://localhost:3000/metrics`
- EC2 deployment: [deploy/ec2/README.md](deploy/ec2/README.md)
