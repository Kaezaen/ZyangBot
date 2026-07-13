import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderProgressBar } from "./progressBar.js";

const FILLED = "▰";
const EMPTY = "▱";

describe("renderProgressBar", () => {
  it("keeps a constant total length", () => {
    for (const pos of [0, 25, 50, 75, 100]) {
      assert.equal([...renderProgressBar(pos, 100, 16)].length, 16);
    }
  });

  it("is fully empty at position 0", () => {
    assert.equal(renderProgressBar(0, 100, 10), EMPTY.repeat(10));
  });

  it("is fully filled at the end", () => {
    assert.equal(renderProgressBar(100, 100, 10), FILLED.repeat(10));
  });

  it("fills proportionally to position", () => {
    const bar = renderProgressBar(50, 100, 10);
    assert.equal(bar, `${FILLED.repeat(5)}${EMPTY.repeat(5)}`);
  });

  it("clamps out-of-range positions", () => {
    assert.equal(renderProgressBar(-50, 100, 8), EMPTY.repeat(8));
    assert.equal(renderProgressBar(500, 100, 8), FILLED.repeat(8));
  });

  it("shows an empty bar for unknown duration (streams)", () => {
    assert.equal(renderProgressBar(1000, 0, 12), EMPTY.repeat(12));
  });
});
