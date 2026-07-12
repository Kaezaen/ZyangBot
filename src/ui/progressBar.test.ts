import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderProgressBar } from "./progressBar.js";

describe("renderProgressBar", () => {
  it("keeps a constant total length with exactly one knob", () => {
    for (const pos of [0, 25, 50, 75, 100]) {
      const bar = renderProgressBar(pos, 100, 18);
      assert.equal([...bar].length, 18);
      assert.equal((bar.match(/◉/g) ?? []).length, 1);
    }
  });

  it("puts the knob at the start at position 0", () => {
    assert.ok(renderProgressBar(0, 100, 10).startsWith("◉"));
  });

  it("puts the knob at the end at full position", () => {
    assert.ok(renderProgressBar(100, 100, 10).endsWith("◉"));
  });

  it("clamps out-of-range positions", () => {
    assert.ok(renderProgressBar(-50, 100, 10).startsWith("◉"));
    assert.ok(renderProgressBar(500, 100, 10).endsWith("◉"));
  });

  it("handles unknown duration (streams) without dividing by zero", () => {
    const bar = renderProgressBar(1000, 0, 12);
    assert.equal([...bar].length, 12);
    assert.ok(bar.startsWith("◉"));
  });
});
