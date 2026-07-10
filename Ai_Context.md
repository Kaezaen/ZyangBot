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
```

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

Completed

✅ Git

✅ GitHub

✅ Docker

✅ pnpm

✅ TypeScript

✅ ESLint

✅ Prettier

✅ Environment Validation

✅ Discord Configuration

✅ Discord Client Login

✅ Bot Online

---

# Current Bot Status

The bot successfully:

- connects to Discord
- logs in
- reaches ClientReady event
- appears online in Discord

Current client initialization is similar to

```ts
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

client.once(Events.ClientReady, () => {

});

await client.login(config.discord.token);
```

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

Completed

✅ Environment

✅ Configuration

✅ Discord Login

✅ Bot Online

Current Milestone

⬜ Slash Command Deployment

⬜ /ping

⬜ Interaction Handler

Next

⬜ Command Loader

⬜ Automatic Command Discovery

⬜ Music Module

⬜ Lavalink

⬜ Spotify Integration

⬜ Queue System

⬜ Player Controller

⬜ Discord Embeds

⬜ Buttons

⬜ Docker Deployment

⬜ AWS Deployment

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

Implement the first Slash Command.

Tasks:

1. Create

```
src/commands/ping.ts
```

2. Create

```
src/deploy-commands.ts
```

3. Register Slash Command with Discord.

4. Handle InteractionCreate event.

5. Execute

```ts
pingCommand.execute(interaction)
```

Expected result

```
/ping

↓

🏓 Pong!
```

---

# Final Objective

Build a production-ready Discord Music Bot with professional engineering practices while ensuring the developer understands the purpose behind every architectural decision rather than simply copying code.