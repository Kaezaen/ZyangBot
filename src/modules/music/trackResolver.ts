import { LoadType, type Track as LavalinkTrack } from "shoukaku";
import type { Track } from "./track.js";

/**
 * Pure helpers that turn a Lavalink resolve response into our internal Track
 * shape. Extracted from MusicService so the parsing logic can be unit-tested
 * without a live Lavalink node.
 */

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
    return data.filter(isTrack);
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
  }));
}
