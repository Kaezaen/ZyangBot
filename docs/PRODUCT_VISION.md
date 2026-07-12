# ZyangBot Product Vision

> This document defines the long-term product direction for ZyangBot.
>
> Every feature, UI, UX, and engineering decision should support this vision.

---

# Product Goal

ZyangBot is not intended to become "just another Discord music bot".

The goal is to build a music bot that feels:

- Professional
- Clean
- Modern
- Fast
- Reliable
- Consistent

Users should immediately recognize the bot by its visual identity and interaction style.

Every interaction should feel intentional.

---

# Product Principles

## 1. Simplicity

Do not overload the user with information.

Only display information that helps the current action.

---

## 2. Consistency

Every embed should follow the same design language.

Users should immediately recognize that every message belongs to ZyangBot.

---

## 3. Clarity

Every response should clearly communicate:

- What happened
- Why it happened
- What the user should do next

---

## 4. Minimalism

Avoid unnecessary decorations.

Do not spam emojis.

Whitespace and alignment are preferred over visual clutter.

---

# Design Language

Theme:

Modern

Minimal

Professional

Elegant

Inspired by:

- FlaviBot
- Spotify
- Discord Native UI

Do NOT imitate them.

Create a unique identity.

---

# Color Palette

Primary

#778873

Purpose:

- Music Player
- Now Playing
- Queue
- General Music Information

---

Success

#A1BC98

Purpose:

- Song Added
- Playlist Added
- Queue Updated

---

Warning

#DCCFC0

Purpose:

- Idle Timeout
- Leaving Voice Channel
- Informational Warnings

---

Error

Choose a soft red.

Avoid bright aggressive red.

Purpose:

- Playback Error
- Join Error
- Lavalink Error
- Search Failure

---

# UI Components

Every message should belong to one of these categories.

## Music Player

Persistent player information.

Contains:

- Song title
- Artist
- Thumbnail
- Requested by
- Voice channel
- Queue size
- Volume
- Loop mode
- Progress bar
- Playback controls

---

## Success Message

Examples:

Song added

Playlist added

Queue updated

Minimal information.

Avoid large embeds.

---

## Warning Message

Examples:

Disconnected because of inactivity

Node reconnecting

Voice disconnected

Should clearly explain what happened.

---

## Error Message

Examples:

Song not found

Lavalink unavailable

Voice join failed

Spotify unavailable

Always include a human-readable reason.

---

## Queue View

Display upcoming songs.

Easy to scan.

Avoid huge blocks of text.

Pagination should be considered.

---

# Music Player Layout

The default player should contain:

--------------------------------------------------

Now Playing

Song Title

Artist

Added by

Voice Channel

Queue

Volume

Loop

Progress Bar

Current Time / Total Duration

Buttons:

Pause

Resume

Skip

Stop

Queue

Lyrics

--------------------------------------------------

This layout should remain consistent throughout the project.

---

# UX Principles

Every command should answer these questions.

What happened?

What should I do next?

Can I interact further?

---

# Buttons

Buttons should replace repeated slash commands whenever possible.

Preferred controls:

Pause

Resume

Skip

Stop

Queue

Lyrics

Future:

Shuffle

Loop

Volume

Autoplay

---

# Future Features

Future features must integrate naturally into the current UI.

Never redesign the player because of a new feature.

Examples:

Spotify

Playlist

Autoplay

Radio

Recommendations

Filters

Equalizer

Nightcore

Bass Boost

Dashboard

---

# Engineering Principles

Backend architecture must support the UI.

UI should never contain business logic.

Commands should never build embeds directly.

Instead:

Command

↓

Music Service

↓

Embed Builder

↓

Discord

---

# Embed Builders

Every embed should be reusable.

Suggested structure:

shared/

embeds/

player/

success/

warning/

error/

queue/

lyrics/

No duplicated embed code.

---

# Product Rule

Before implementing any feature, ask:

Does this improve the product experience?

If not,

reconsider the implementation.

---

# Final Vision

The final product should feel like a polished commercial Discord application rather than a collection of independent slash commands.

Users should experience:

Consistency

↓

Reliability

↓

Professional UI

↓

Fast interactions

↓

Modern Discord-native experience

# Design Goal

The visual identity of ZyangBot should be immediately recognizable.

Users should be able to identify a ZyangBot message without reading the bot's name.

Recognition should come from:

- Layout
- Typography hierarchy
- Color usage
- Information density
- Interaction style
- Button placement
- Message structure

The goal is not to create "beautiful embeds".

The goal is to create a recognizable product identity.