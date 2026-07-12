import type { Track } from "./track.js";

export class GuildQueue {
  private readonly tracks: Track[] = [];

  get isEmpty(): boolean {
    return this.tracks.length === 0;
  }

  get current(): Track | undefined {
    return this.tracks[0];
  }

  get items(): readonly Track[] {
    return [...this.tracks];
  }

  add(track: Track): void {
    this.tracks.push(track);
  }

  advance(): Track | undefined {
    return this.tracks.shift();
  }

  clear(): void {
    this.tracks.length = 0;
  }
}
