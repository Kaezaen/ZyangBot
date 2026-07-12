import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatDuration } from "./formatDuration.js";

describe("formatDuration", () => {
  it("formats zero as mm:ss", () => {
    assert.equal(formatDuration(0), "00:00");
  });

  it("floors sub-second values", () => {
    assert.equal(formatDuration(500), "00:00");
    assert.equal(formatDuration(1999), "00:01");
  });

  it("pads seconds and minutes to two digits", () => {
    assert.equal(formatDuration(1_000), "00:01");
    assert.equal(formatDuration(61_000), "01:01");
  });

  it("omits the hours segment below one hour", () => {
    assert.equal(formatDuration(600_000), "10:00");
  });

  it("includes hours (unpadded) once past one hour", () => {
    assert.equal(formatDuration(3_600_000), "1:00:00");
    assert.equal(formatDuration(3_661_000), "1:01:01");
  });
});
