import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { describe, it } from "node:test";
import {
  attachQueueAdvancement,
  type PlayerEventSource,
  shouldAdvanceOnEnd,
} from "./playerEvents.js";

class FakePlayer extends EventEmitter {
  guildId = "guild-1";
}

describe("shouldAdvanceOnEnd", () => {
  it("advances on natural end and load failure", () => {
    assert.equal(shouldAdvanceOnEnd("finished"), true);
    assert.equal(shouldAdvanceOnEnd("loadFailed"), true);
  });

  it("does not advance on caller-triggered reasons", () => {
    assert.equal(shouldAdvanceOnEnd("stopped"), false);
    assert.equal(shouldAdvanceOnEnd("replaced"), false);
    assert.equal(shouldAdvanceOnEnd("cleanup"), false);
  });
});

describe("attachQueueAdvancement", () => {
  function setup() {
    const player = new FakePlayer();
    let advances = 0;
    attachQueueAdvancement(player as PlayerEventSource, () => {
      advances += 1;
    });
    return { player, getAdvances: () => advances };
  }

  it("advances exactly once when a failed track emits exception then end(loadFailed)", () => {
    const { player, getAdvances } = setup();

    // This is the double-advance regression: a failing track emits BOTH events.
    player.emit("exception", { exception: new Error("boom") });
    player.emit("end", { reason: "loadFailed" });

    assert.equal(getAdvances(), 1);
  });

  it("advances once on natural finish", () => {
    const { player, getAdvances } = setup();

    player.emit("end", { reason: "finished" });

    assert.equal(getAdvances(), 1);
  });

  it("does not advance on an exception alone", () => {
    const { player, getAdvances } = setup();

    player.emit("exception", { exception: new Error("boom") });

    assert.equal(getAdvances(), 0);
  });

  it("does not advance on caller-triggered end reasons", () => {
    const { player, getAdvances } = setup();

    player.emit("end", { reason: "stopped" });
    player.emit("end", { reason: "replaced" });
    player.emit("end", { reason: "cleanup" });

    assert.equal(getAdvances(), 0);
  });
});
