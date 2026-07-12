# ZyangBot AI Context

> This document provides complete project context for any AI assistant or developer joining the project.
>
> Goal: Continue development without asking for previously completed work.

---

# Project Overview

## Project Name

**ZyangBot**

## Description

ZyangBot is a modern Discord Music Bot built with TypeScript and Discord.js.

The project is intended to become a production-ready music bot supporting:

- YouTube playback (via Lavalink)
- Spotify playback (Spotify URL -> YouTube search)
- Queue management
- Modern Slash Commands
- Docker deployment
- AWS EC2 24/7 hosting

The bot is currently private and intended for personal/community Discord servers.

---

# Main Goal

The objective is **NOT** simply to build a music bot.

The objective is to understand **why every piece of code exists**.

Every architectural decision should be explained before implementation.

Learning philosophy:

Problem
↓
Visualization
↓
Analogy
↓
Implementation

NOT

Theory
↓
Copy code

---

# Tech Stack

Runtime

- Node.js 22

Package Manager

- pnpm

Language

- TypeScript

Discord Library

- discord.js v14

Validation

- Zod

Logger

- Pino

Terminal Colors

- picocolors

Code Quality

- ESLint
- Prettier

Deployment

- Docker
- AWS EC2

---

# Installed Packages

Production

- discord.js
- shoukaku (Lavalink client)
- prom-client (Prometheus metrics)
- dotenv
- zod
- pino
- picocolors

Development

- typescript
- tsx
- @types/node

- eslint
- @eslint/js
- typescript-eslint
- eslint-config-prettier
- eslint-plugin-import
- prettier

---

# Project Structure

```
ZyangBot/

src/

    app/

        client/

        events/

        interactions/

    commands/

    core/

        config/

        logger/

        constants/

        errors/

    modules/

    services/

    shared/

    index.ts

.env

.env.example

package.json

tsconfig.json

README.md
```

---

# TypeScript Configuration

Using

- ESNext
- NodeNext
- Strict Mode
- ESM

package.json

```json
{
    "type": "module"
}
```

---

# Environment Configuration

Already implemented.

Location

```
src/core/config/
```

Files

```
schema.ts
index.ts
```

Using

- dotenv
- zod

Current Environment Variables

```
NODE_ENV

DISCORD_TOKEN
CLIENT_ID
GUILD_ID

LAVALINK_NAME
LAVALINK_URL
LAVALINK_PASSWORD   (required, no default)

SPOTIFY_CLIENT_ID       (optional)
SPOTIFY_CLIENT_SECRET   (optional)

LOG_LEVEL
METRICS_PORT
```

See `.env.example` for the full list, and `src/core/config/schema.ts` for
validation rules.

Configuration exported as

```ts
config.discord.token
```

instead of

```ts
process.env.DISCORD_TOKEN
```

---

# Current Progress

The project is well past its initial scaffold — it is a full, production-hardened
music bot. `docs/ROADMAP.MD` is the authoritative phase status. In short:

✅ Tooling: Git/GitHub, pnpm, TypeScript (strict, ESM), Docker

✅ Config validation (Zod), Discord login, bot online

✅ Slash commands (auto-discovered), interaction + button handling

✅ Music: Lavalink via Shoukaku, per-guild queue, Spotify via LavaSrc, lyrics

✅ Player embeds + control buttons

✅ Docker Compose stack (verified) + EC2 deploy artifacts

✅ Pino logging + Prometheus metrics (`GET /metrics`)

✅ Hardening: crash guards, graceful shutdown, healthchecks, non-root
   container, resource limits; a `node:test` suite (31 tests)

Note: ESLint/Prettier are present as dev dependencies but **not yet
configured** — there is no eslint config and no `lint` script.

---

# Current Bot Status

The bot runs the full flow end-to-end (verified via `docker compose up`):

- connects to Discord and reaches ClientReady
- connects to a Lavalink node through Shoukaku
- serves every slash command and the music control buttons
- exposes Prometheus metrics on `GET /metrics`
- shuts down gracefully on SIGTERM/SIGINT

Intents in use: `Guilds` and `GuildVoiceStates`
(see `src/app/client/ZyangClient.ts`).

---

# Engineering Philosophy

The project intentionally avoids overengineering.

Development order:

Make it Work

↓

Make it Clean

↓

Make it Scalable

Do NOT build complex frameworks before having a working feature.

---

# Architecture Philosophy

Single Responsibility Principle.

Every file has one responsibility.

Examples

Config

Responsible for loading configuration.

Logger

Responsible for logging.

Command

Responsible only for one Discord command.

Deploy

Responsible only for registering commands.

Discord Client

Responsible only for managing Discord connection.

---

# Learning Style

The developer is still learning Discord.js and TypeScript.

Important:

The developer does NOT learn effectively by copying code.

Instead, explanations should always follow this order:

1. Explain the problem.
2. Explain why the problem exists.
3. Use a real-world analogy.
4. Show implementation.

Do not immediately provide complete files unless explicitly requested.

Encourage reasoning before implementation.

---

# Current Understanding

The developer already understands:

✅ Discord Client

✅ Discord Events

✅ ClientReady

✅ Interaction concept

✅ Slash Command concept

✅ Difference between

- Discord
- Bot

Developer understands that:

Discord stores

- command name
- description
- parameters

Bot executes

```ts
execute()
```

---

# Slash Command Design

Every command should follow the same pattern.

Example

```ts
export const pingCommand = {

    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!"),

    async execute(interaction) {

    }

}
```

Later commands

```
play.ts

queue.ts

pause.ts

skip.ts

lyrics.ts
```

must follow exactly the same structure.

---

# Deployment Philosophy

Deploying commands and running the bot are different processes.

deploy-commands.ts

Responsible for sending command metadata to Discord.

index.ts

Responsible for running the bot.

Do NOT combine these responsibilities.

---

# Current Roadmap

See `docs/ROADMAP.MD` for authoritative, up-to-date status. The foundation
(Phases 1–8), logging, and metrics are complete, as is production hardening
(process safety, deployment, and a test foundation). Remaining work lives in
that file's backlog — e.g. metrics scraping, a `/health` readiness endpoint,
`TrackStuckEvent` handling, and queue features.

---

# Long-Term Music Architecture

Discord User

↓

Slash Command

↓

Interaction

↓

Command

↓

Music Service

↓

Lavalink

↓

Voice Channel

Spotify URLs are NOT streamed directly.

Flow

Spotify URL

↓

Spotify API

↓

Extract metadata

↓

Search YouTube

↓

Play YouTube audio via Lavalink

---

# Coding Rules

Always prefer

Readable code

↓

Maintainable code

↓

Scalable code

Avoid unnecessary abstractions.

Avoid overengineering.

Do not introduce new architecture without explaining WHY.

---

# AI Assistant Rules

When helping with this project:

- Explain the reason before the code.
- Teach concepts using analogies whenever possible.
- Do not assume the developer understands advanced TypeScript.
- Introduce concepts only when they naturally appear in the project.
- Avoid jumping directly to advanced architecture.
- Keep explanations practical and tied to the current milestone.
- If refactoring is suggested, ensure there is already a working implementation first.

---

# Immediate Next Task

The foundation and hardening are done. Pick the next item from the backlog in
`docs/ROADMAP.MD`. Strong candidates:

- Metrics scraping + a dashboard (nothing consumes `/metrics` yet).
- A `/health` readiness endpoint that reflects Discord connectivity (the
  current Docker healthcheck is liveness-only).
- Handle `TrackStuckEvent` so a stuck track cannot freeze the queue.

When adding, changing, or removing a command, remember to re-run
`pnpm deploy:commands` (deploying commands and running the bot are separate
processes).

---

# Final Objective

Build a production-ready Discord Music Bot with professional engineering practices while ensuring the developer understands the purpose behind every architectural decision rather than simply copying code.