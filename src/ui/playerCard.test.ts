import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Colors } from "./colors.js";
import {
  buildPlayerCard,
  PlayerButtonId,
  type PlayerView,
} from "./playerCard.js";

function view(overrides: Partial<PlayerView> = {}): PlayerView {
  return {
    state: "playing",
    track: {
      title: "Lose Yourself",
      author: "Eminem",
      durationMs: 320_000,
      sourceUrl: "https://example.com/track",
      thumbnailUrl: "https://example.com/art.jpg",
    },
    positionMs: 102_000,
    requestedByUserId: "111",
    voiceChannelId: "222",
    queueSize: 5,
    ...overrides,
  };
}

type ButtonData = Partial<{
  custom_id: string;
  label: string;
  disabled: boolean;
  style: number;
}>;

function buttons(card: ReturnType<typeof buildPlayerCard>): ButtonData[] {
  const row = card.components[0];
  assert.ok(row, "expected an action row");
  return row.components.map((b) => b.data as ButtonData);
}

describe("buildPlayerCard", () => {
  it("renders the Now Playing header and primary content", () => {
    const card = buildPlayerCard(view());
    const embed = card.embeds[0]?.data;

    assert.ok(embed?.author?.name?.includes("Now Playing"));
    assert.equal(embed?.color, Colors.primary);
    assert.equal(embed?.title, "Lose Yourself");
    assert.equal(embed?.url, "https://example.com/track");
    assert.equal(embed?.thumbnail?.url, "https://example.com/art.jpg");
    assert.ok(embed?.description?.includes("Eminem"));
    assert.ok(embed?.description?.includes("◉"), "shows the progress bar");
  });

  it("shows metadata fields for active playback", () => {
    const embed = buildPlayerCard(view()).embeds[0]?.data;
    const fields = embed?.fields ?? [];

    assert.deepEqual(
      fields.map((f) => [f.name, f.value]),
      [
        ["Requested by", "<@111>"],
        ["Voice", "<#222>"],
        ["Queue", "5 Tracks"],
      ],
    );
  });

  it("keeps the button order fixed with Lyrics disabled", () => {
    const ids = buttons(buildPlayerCard(view())).map((b) => b.custom_id);
    assert.deepEqual(ids, [
      PlayerButtonId.pause,
      PlayerButtonId.skip,
      PlayerButtonId.stop,
      PlayerButtonId.queue,
      PlayerButtonId.lyrics,
    ]);

    const lyrics = buttons(buildPlayerCard(view())).at(-1);
    assert.equal(lyrics?.disabled, true);
  });

  it("swaps Pause for Resume when paused", () => {
    const first = buttons(buildPlayerCard(view({ state: "paused" })))[0];
    assert.equal(first?.custom_id, PlayerButtonId.resume);
    assert.equal(first?.label, "Resume");
    assert.equal(first?.disabled, false);
  });

  it("disables controls while loading and hides progress", () => {
    const card = buildPlayerCard(view({ state: "loading" }));
    assert.ok(card.embeds[0]?.data.author?.name?.includes("Loading"));
    assert.ok(!card.embeds[0]?.data.description?.includes("◉"));
    assert.ok(buttons(card).every((b) => b.disabled === true));
  });

  it("marks Queue Finished with a warning color and disabled controls", () => {
    const card = buildPlayerCard(view({ state: "queueFinished" }));
    assert.ok(card.embeds[0]?.data.author?.name?.includes("Queue Finished"));
    assert.equal(card.embeds[0]?.data.color, Colors.warning);
    assert.ok(card.embeds[0]?.data.footer?.text);
    assert.ok(buttons(card).every((b) => b.disabled === true));
  });

  it("removes all controls when disconnected", () => {
    const card = buildPlayerCard(
      view({ state: "disconnected", reason: "Left the voice channel." }),
    );
    assert.ok(card.embeds[0]?.data.author?.name?.includes("Disconnected"));
    assert.equal(card.embeds[0]?.data.color, Colors.error);
    assert.equal(card.components.length, 0);
  });
});
