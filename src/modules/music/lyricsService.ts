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
    const response = await fetch(`https://lrclib.net/api/get?${query}`);

    if (!response.ok) {
      return undefined;
    }

    const parsed = lyricsResponseSchema.safeParse(await response.json());

    if (!parsed.success) {
      return undefined;
    }

    return parsed.data.syncedLyrics ?? parsed.data.plainLyrics ?? undefined;
  }
}

export const lyricsService = new LyricsService();
