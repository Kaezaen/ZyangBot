# Architecture

```
Discord User
      │
      ▼
Slash Command
      │
      ▼
Interaction
      │
      ▼
Command
      │
      ▼
Music Service
      │
      ▼
Lavalink
      │
      ▼
Voice Channel
```

Each layer has a single responsibility.

Commands should never communicate directly with Lavalink.

All music operations go through the Music Service.