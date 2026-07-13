import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Colors } from "./colors.js";
import { buildLyricsCard } from "./lyricsCard.js";

const track = { title: "Style", author: "Taylor Swift" };

describe("buildLyricsCard", () => {
  it("renders the Lyrics header, title, and lyrics body", () => {
    const embed = buildLyricsCard(track, "line one\nline two").embeds[0]?.data;

    assert.equal(embed?.author?.name, "Lyrics");
    assert.equal(embed?.color, Colors.primary);
    assert.equal(embed?.title, "Style — Taylor Swift");
    assert.ok(embed?.description?.includes("line one"));
    assert.ok(embed?.footer?.text?.includes("lrclib"));
  });

  it("truncates lyrics longer than the embed limit", () => {
    const embed = buildLyricsCard(track, "a".repeat(5000)).embeds[0]?.data;

    assert.ok((embed?.description?.length ?? 0) <= 4096);
    assert.ok(embed?.description?.includes("truncated"));
  });
});
