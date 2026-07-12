import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GuildQueue } from "./guildQueue.js";
import type { Track } from "./track.js";

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    encoded: "encoded",
    title: "Title",
    author: "Author",
    durationMs: 1000,
    requestedByUserId: "user-1",
    ...overrides,
  };
}

describe("GuildQueue", () => {
  it("starts empty", () => {
    const queue = new GuildQueue();

    assert.equal(queue.isEmpty, true);
    assert.equal(queue.current, undefined);
    assert.deepEqual(queue.items, []);
  });

  it("keeps the first added track as current (FIFO)", () => {
    const queue = new GuildQueue();
    const first = makeTrack({ title: "First" });
    const second = makeTrack({ title: "Second" });

    queue.add(first);
    queue.add(second);

    assert.equal(queue.isEmpty, false);
    assert.equal(queue.current, first);
    assert.deepEqual(
      queue.items.map((track) => track.title),
      ["First", "Second"],
    );
  });

  it("advance() removes and returns the current track", () => {
    const queue = new GuildQueue();
    const first = makeTrack({ title: "First" });
    const second = makeTrack({ title: "Second" });
    queue.add(first);
    queue.add(second);

    const removed = queue.advance();

    assert.equal(removed, first);
    assert.equal(queue.current, second);
  });

  it("advance() on an empty queue returns undefined", () => {
    const queue = new GuildQueue();

    assert.equal(queue.advance(), undefined);
  });

  it("clear() empties the queue", () => {
    const queue = new GuildQueue();
    queue.add(makeTrack());
    queue.add(makeTrack());

    queue.clear();

    assert.equal(queue.isEmpty, true);
    assert.equal(queue.current, undefined);
  });

  it("items is a defensive copy that cannot mutate internal state", () => {
    const queue = new GuildQueue();
    queue.add(makeTrack({ title: "Only" }));

    const snapshot = queue.items as Track[];
    snapshot.pop();

    // Mutating the returned array must not empty the real queue.
    assert.equal(queue.isEmpty, false);
    assert.equal(queue.current?.title, "Only");
  });
});
