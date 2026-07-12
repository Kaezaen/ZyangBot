import { LoadType, type Track as LavalinkTrack } from "shoukaku";
import type { Track } from "./track.js";

/**
 * Pure helpers that turn a Lavalink resolve response into our internal Track
 * shape. Extracted from MusicService so the parsing logic can be unit-tested
 * without a live Lavalink node.
 */

/**
 * Prepares a user query for Lavalink. URLs (including Spotify) and explicit
 * source prefixes (`ytsearch:`, `spsearch:`, ...) are passed through untouched
 * so Lavalink/LavaSrc resolves them directly. Plain text becomes a YouTube
 * search, so a user can type a song title instead of a link.
 */
export function normalizeQuery(query: string): string {
  const trimmed = query.trim();

  if (
    /^https?:\/\//i.test(trimmed) ||
    /^[a-z]+search:/i.test(trimmed) ||
    /^spotify:/i.test(trimmed)
  ) {
    return trimmed;
  }

  return `ytsearch:${trimmed}`;
}

export function isTrack(value: unknown): value is LavalinkTrack {
  return (
    typeof value === "object" &&
    value !== null &&
    "encoded" in value &&
    "info" in value
  );
}

export function isPlaylist(
  value: unknown,
): value is { tracks: LavalinkTrack[] } {
  return (
    typeof value === "object" &&
    value !== null &&
    "tracks" in value &&
    Array.isArray(value.tracks) &&
    value.tracks.every(isTrack)
  );
}

export function extractTracks(
  loadType: LoadType | undefined,
  data: unknown,
): LavalinkTrack[] {
  if (loadType === LoadType.TRACK && isTrack(data)) {
    return [data];
  }

  if (loadType === LoadType.SEARCH && Array.isArray(data)) {
    // A search returns many matches; queue only the best (first) one.
    const first = data.find(isTrack);
    return first ? [first] : [];
  }

  if (loadType === LoadType.PLAYLIST && isPlaylist(data)) {
    return data.tracks;
  }

  return [];
}

export function toTracks(
  loadType: LoadType | undefined,
  data: unknown,
  requestedByUserId: string,
): Track[] {
  return extractTracks(loadType, data).map((track) => ({
    encoded: track.encoded,
    title: track.info.title,
    author: track.info.author,
    durationMs: track.info.length,
    requestedByUserId,
    ...(track.info.uri ? { sourceUrl: track.info.uri } : {}),
    ...(track.info.artworkUrl
      ? { thumbnailUrl: track.info.artworkUrl }
      : {}),
  }));
}
