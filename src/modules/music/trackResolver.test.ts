import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LoadType } from "shoukaku";
import { extractTracks, isPlaylist, isTrack, toTracks } from "./trackResolver.js";

function lavalinkTrack(
  info: Record<string, unknown> = {},
): { encoded: string; info: Record<string, unknown> } {
  return {
    encoded: "encoded",
    info: { title: "Title", author: "Author", length: 1_000, ...info },
  };
}

describe("isTrack", () => {
  it("accepts objects with encoded and info", () => {
    assert.equal(isTrack(lavalinkTrack()), true);
  });

  it("rejects non-track values", () => {
    assert.equal(isTrack(null), false);
    assert.equal(isTrack("track"), false);
    assert.equal(isTrack({ encoded: "x" }), false);
    assert.equal(isTrack({ info: {} }), false);
  });
});

describe("isPlaylist", () => {
  it("accepts a tracks array of valid tracks", () => {
    assert.equal(isPlaylist({ tracks: [lavalinkTrack(), lavalinkTrack()] }), true);
  });

  it("rejects when any entry is not a track", () => {
    assert.equal(isPlaylist({ tracks: [lavalinkTrack(), { nope: true }] }), false);
  });

  it("rejects when tracks is missing or not an array", () => {
    assert.equal(isPlaylist({}), false);
    assert.equal(isPlaylist({ tracks: "no" }), false);
  });
});

describe("extractTracks", () => {
  it("returns a single track for TRACK", () => {
    const track = lavalinkTrack();
    assert.deepEqual(extractTracks(LoadType.TRACK, track), [track]);
  });

  it("returns [] for TRACK when data is not a track", () => {
    assert.deepEqual(extractTracks(LoadType.TRACK, { bad: true }), []);
  });

  it("filters SEARCH results to valid tracks only", () => {
    const good = lavalinkTrack();
    assert.deepEqual(extractTracks(LoadType.SEARCH, [good, { bad: true }]), [good]);
  });

  it("returns playlist tracks for PLAYLIST", () => {
    const tracks = [lavalinkTrack(), lavalinkTrack()];
    assert.deepEqual(extractTracks(LoadType.PLAYLIST, { tracks }), tracks);
  });

  it("returns [] for an invalid playlist", () => {
    assert.deepEqual(extractTracks(LoadType.PLAYLIST, { tracks: [{ bad: true }] }), []);
  });

  it("returns [] for undefined or empty load types", () => {
    assert.deepEqual(extractTracks(undefined, lavalinkTrack()), []);
    assert.deepEqual(extractTracks(LoadType.EMPTY, lavalinkTrack()), []);
  });
});

describe("toTracks", () => {
  it("maps Lavalink info onto the internal Track shape", () => {
    const data = lavalinkTrack({ uri: "https://example.com/song" });

    const [track] = toTracks(LoadType.TRACK, data, "user-9");

    assert.ok(track);
    assert.deepEqual(track, {
      encoded: "encoded",
      title: "Title",
      author: "Author",
      durationMs: 1_000,
      requestedByUserId: "user-9",
      sourceUrl: "https://example.com/song",
    });
  });

  it("omits sourceUrl when the track has no uri", () => {
    const [track] = toTracks(LoadType.TRACK, lavalinkTrack(), "user-1");

    assert.ok(track);
    assert.equal("sourceUrl" in track, false);
  });

  it("returns [] when nothing resolves", () => {
    assert.deepEqual(toTracks(LoadType.EMPTY, null, "user-1"), []);
  });
});
