export type Track = {
  encoded: string;
  title: string;
  author: string;
  durationMs: number;
  sourceUrl?: string;
  thumbnailUrl?: string;
  requestedByUserId: string;
};
