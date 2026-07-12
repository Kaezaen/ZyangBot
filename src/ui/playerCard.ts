import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type APIEmbedField,
  type EmbedBuilder,
} from "discord.js";
import { formatDuration } from "../shared/formatDuration.js";
import { buildCardEmbed, type CardSection } from "./card.js";
import { Colors } from "./colors.js";
import { renderProgressBar } from "./progressBar.js";

/** Button custom IDs. The prefix routes them to the music control handler. */
export const PlayerButtonId = {
  pause: "music:pause",
  resume: "music:resume",
  skip: "music:skip",
  stop: "music:stop",
  queue: "music:queue",
  lyrics: "music:lyrics",
} as const;

export type PlayerCardState =
  | "playing"
  | "paused"
  | "loading"
  | "queueFinished"
  | "disconnected";

export type PlayerCardTrack = {
  title: string;
  author: string;
  durationMs: number;
  sourceUrl?: string;
  thumbnailUrl?: string;
};

export type PlayerView = {
  state: PlayerCardState;
  track?: PlayerCardTrack;
  positionMs: number;
  requestedByUserId?: string;
  voiceChannelId?: string;
  queueSize: number;
  reason?: string;
};

export type CardMessage = {
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
};

/** The one music icon, used consistently in every header (spec-permitted). */
const MUSIC_ICON = "🎵";

const HEADERS: Record<PlayerCardState, string> = {
  playing: "Now Playing",
  paused: "Paused",
  loading: "Loading…",
  queueFinished: "Queue Finished",
  disconnected: "Disconnected",
};

const DEFAULT_FOOTER: Partial<Record<PlayerCardState, string>> = {
  queueFinished: "Playback finished — the queue is empty.",
  disconnected: "Left the voice channel.",
};

function colorFor(state: PlayerCardState): number {
  if (state === "disconnected") return Colors.error;
  if (state === "queueFinished") return Colors.warning;
  return Colors.primary;
}

/** Plain progress bar with the current and total time beneath it — no box. */
function progressBlock(positionMs: number, durationMs: number): string {
  const bar = renderProgressBar(positionMs, durationMs);
  const current = formatDuration(positionMs);
  const total = formatDuration(durationMs);

  return `${bar}\n${current} / ${total}`;
}

function buildDescription(view: PlayerView): string | undefined {
  if (!view.track || view.state === "loading" || view.state === "disconnected") {
    return undefined;
  }

  const lines = [view.track.author];

  if (view.state === "playing" || view.state === "paused") {
    lines.push(progressBlock(view.positionMs, view.track.durationMs));
  } else if (view.state === "queueFinished") {
    // Progress complete for the track that just finished.
    lines.push(progressBlock(view.track.durationMs, view.track.durationMs));
  }

  return lines.join("\n\n");
}

function buildFields(view: PlayerView): APIEmbedField[] | undefined {
  if (view.state !== "playing" && view.state !== "paused") {
    return undefined;
  }

  return [
    {
      name: "Requested by",
      value: view.requestedByUserId ? `<@${view.requestedByUserId}>` : "—",
      inline: true,
    },
    {
      name: "Voice",
      value: view.voiceChannelId ? `<#${view.voiceChannelId}>` : "—",
      inline: true,
    },
    { name: "Queue", value: String(view.queueSize), inline: true },
  ];
}

function buildActionRow(
  view: PlayerView,
): ActionRowBuilder<ButtonBuilder>[] {
  // Disconnected is terminal: the controls are removed entirely.
  if (view.state === "disconnected") {
    return [];
  }

  const controlsDisabled =
    view.state === "loading" || view.state === "queueFinished";
  const paused = view.state === "paused";

  // Fixed order forever (spec): Pause/Resume, Skip, Stop, Queue, Lyrics.
  const pauseResume = new ButtonBuilder()
    .setCustomId(paused ? PlayerButtonId.resume : PlayerButtonId.pause)
    .setLabel(paused ? "Resume" : "Pause")
    .setStyle(paused ? ButtonStyle.Success : ButtonStyle.Secondary)
    .setDisabled(controlsDisabled);

  const skip = new ButtonBuilder()
    .setCustomId(PlayerButtonId.skip)
    .setLabel("Skip")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(controlsDisabled);

  const stop = new ButtonBuilder()
    .setCustomId(PlayerButtonId.stop)
    .setLabel("Stop")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(controlsDisabled);

  const queue = new ButtonBuilder()
    .setCustomId(PlayerButtonId.queue)
    .setLabel("Queue")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(controlsDisabled);

  // Lyrics is a disabled placeholder for the MVP (spec).
  const lyrics = new ButtonBuilder()
    .setCustomId(PlayerButtonId.lyrics)
    .setLabel("Lyrics")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true);

  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      pauseResume,
      skip,
      stop,
      queue,
      lyrics,
    ),
  ];
}

const STATES_WITH_TITLE: ReadonlySet<PlayerCardState> = new Set([
  "playing",
  "paused",
  "loading",
  "queueFinished",
]);

/**
 * Renders the persistent Player Card for a given playback view. Pure: it maps a
 * PlayerView to Discord embeds + components and performs no I/O.
 */
export function buildPlayerCard(view: PlayerView): CardMessage {
  const showTitle = STATES_WITH_TITLE.has(view.state) && view.track;
  const description = buildDescription(view);
  const fields = buildFields(view);
  const footer = view.reason ?? DEFAULT_FOOTER[view.state];
  const showThumbnail =
    view.state !== "loading" &&
    view.state !== "disconnected" &&
    view.track?.thumbnailUrl;

  const section: CardSection = {
    color: colorFor(view.state),
    author: { name: `${MUSIC_ICON} ${HEADERS[view.state]}` },
    ...(showTitle && view.track ? { title: view.track.title } : {}),
    ...(showTitle && view.track?.sourceUrl ? { url: view.track.sourceUrl } : {}),
    ...(description ? { description } : {}),
    ...(fields ? { fields } : {}),
    ...(showThumbnail && view.track?.thumbnailUrl
      ? { thumbnail: view.track.thumbnailUrl }
      : {}),
    ...(footer ? { footer } : {}),
  };

  return { embeds: [buildCardEmbed(section)], components: buildActionRow(view) };
}
