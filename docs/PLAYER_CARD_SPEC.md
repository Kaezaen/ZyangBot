# PLAYER_CARD_SPEC.md

Version: 1.0 (MVP)
Status: Approved
Owner: Product Team
Reviewer: Technical Lead

---

# Purpose

The Player Card is the heart of ZyangBot.

Every music interaction should revolve around a single persistent Player Card.

Users should never feel like they are interacting with commands.

Instead, they should feel like they are interacting with a music player.

---

# Product Principles

The Player Card must follow the official Zyang Design Language.

Quiet by Design.
Recognizable by Experience.

The card should never look crowded.

The card should never look unfinished.

Every element must have a purpose.

---

# Persistent Player

The Player Card is persistent.

Meaning:

User executes /play

↓

Player Card is created

↓

Pause

↓

Card is edited

↓

Resume

↓

Card is edited

↓

Skip

↓

Card is edited

↓

Track Finished

↓

Card is edited

↓

Queue Empty

↓

Card is updated one final time

No new player messages should be created during playback.

Only one Player Card exists for each guild.

---

# Card Structure

The Player Card always follows this structure.

────────────────────────

HEADER

────────────────────────

PRIMARY CONTENT

────────────────────────

PROGRESS

────────────────────────

METADATA

────────────────────────

ACTIONS

────────────────────────

Every Player Card must follow this hierarchy.

---

# HEADER

Purpose

Immediately tell the user what is happening.

Current title:

Now Playing

Future states:

Paused

Loading...

Queue Finished

Disconnected

The header should never contain emojis except the official music icon if used consistently.

---

# PRIMARY CONTENT

Contains:

Song Title

Artist Name

Album Cover Thumbnail

Rules

Song title is the visual focus.

Artist is secondary.

Thumbnail supports recognition but must never dominate the card.

---

Example

Now Playing

Lose Yourself

Eminem

---

# PROGRESS SECTION

Purpose

Allow users to instantly understand playback progress.

Contains

Progress Bar

Current Time

Total Duration

Example

━━━━━━━━━━━━◉━━━━━━

01:42             05:20

---

# Progress Bar Rules

The progress bar is a ZyangBot signature.

It must be:

Clean

Readable

Consistent

Do not use different styles in different cards.

Recommended style:

━━━━━━━━━━━━◉━━━━━━

Alternative:

██████░░░░░░

Never mix styles.

---

# METADATA

Metadata provides useful context.

Current MVP fields

Requested By

Voice Channel

Queue Size

Future

Loop Mode

Volume

Autoplay

Source

Node

Do not overload the MVP.

---

Layout

Requested by

Kaizen

Voice

General

Queue

5

---

# ACTIONS

Buttons appear at the bottom.

Current MVP

Pause

Skip

Stop

Queue

Lyrics (disabled placeholder)

Future

Shuffle

Loop

Autoplay

Volume

Recommendation

Buttons should remain in the same order forever.

Users build muscle memory.

---

# BUTTON ORDER

1 Pause / Resume

2 Skip

3 Stop

4 Queue

5 Lyrics

Future buttons must never change the first four positions.

---

# PLAYER STATES

The Player Card changes based on playback state.

---

Playing

Header

Now Playing

Pause button enabled

---

Paused

Header

Paused

Resume replaces Pause

Progress freezes

---

Loading

Header

Loading...

Buttons disabled

Progress hidden

---

Queue Finished

Header

Queue Finished

Buttons disabled

Progress complete

Footer explains why playback stopped

---

Disconnected

Header

Disconnected

Buttons removed

Reason shown

---

# COLORS

Primary

#778873

Used for:

Player

Now Playing

General Playback

Success

#A1BC98

Warnings

#DCCFC0

Errors

Soft muted red

Avoid bright red.

---

# Thumbnail

Always shown when available.

Size should remain visually balanced.

The thumbnail supports the song.

It never becomes the focus.

---

# Interaction Rules

Every button edits the existing Player Card.

Never send another Player Card.

No duplicate players.

One guild.

One player.

One Player Card.

---

# User Experience

The Player Card should feel like a real music player.

Not like a Discord command response.

Users should immediately understand:

What is playing

How much remains

Who requested it

What happens next

What they can do

without reading paragraphs.

---

# Visual Density

Low.

Whitespace is preferred.

Avoid visual noise.

---

# Copywriting

Professional

Short

Helpful

Never funny for important playback messages.

Good

Now Playing

Paused

Queue Finished

Unable to Play

Bad

Oops!

Let's go!!

Epic!!

Music time!!

---

# Success Criteria

A user should recognize the Player Card without seeing:

Bot Name

Avatar

Voice Channel

Reply Context

Recognition must come from the layout itself.

If a screenshot is shared online,

people should immediately recognize:

"This is ZyangBot."

---

END OF SPEC