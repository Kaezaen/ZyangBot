import { z } from "zod";
import type { Track } from "./track.js";

const lyricsResponseSchema = z.object({
  plainLyrics: z.string().nullable(),
  syncedLyrics: z.string().nullable(),
});

export class LyricsService {
  async findForTrack(track: Track): Promise<string | undefined> {
    const query = new URLSearchParams({
      track_name: track.title,
      artist_name: track.author,
    });
    const response = await fetch(`https://lrclib.net/api/get?${query}`, {
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return undefined;
    }

    const parsed = lyricsResponseSchema.safeParse(await response.json());

    if (!parsed.success) {
      return undefined;
    }

    // Prefer plain lyrics for display (synced lyrics carry [mm:ss] timestamps,
    // which are for the future real-time view, not plain reading).
    return parsed.data.plainLyrics ?? parsed.data.syncedLyrics ?? undefined;
  }
}

export const lyricsService = new LyricsService();
