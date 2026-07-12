import type { Client } from "discord.js";
import { logger } from "../../core/logger/index.js";
import { buildPlayerCard, type PlayerView } from "../../ui/playerCard.js";
import type { PlayerCardUpdate } from "./musicService.js";

type Binding = { channelId: string; messageId?: string };

/**
 * Owns the persistent Player Card lifecycle: exactly one card message per
 * guild, created once and then edited in place for every playback change.
 *
 * This is the wiring layer — it performs Discord I/O but holds no playback
 * business logic (that lives in MusicService) and builds no embeds itself (that
 * is the Card Builder). Renders are serialized per guild so concurrent updates
 * cannot create duplicate cards.
 */
export class PlayerCardManager {
  private client: Client | undefined;
  private readonly bindings = new Map<string, Binding>();
  private readonly renderChains = new Map<string, Promise<void>>();

  attach(client: Client): void {
    this.client = client;
  }

  /**
   * Remembers the text channel a guild's Player Card lives in. Called when a
   * user starts playback so the card appears where they invoked it. If the
   * channel changes, the old card is dropped so only one card ever exists.
   */
  bind(guildId: string, channelId: string): void {
    const existing = this.bindings.get(guildId);

    if (existing?.channelId === channelId) {
      return;
    }

    if (existing?.messageId) {
      void this.deleteMessage(existing.channelId, existing.messageId);
    }

    this.bindings.set(guildId, { channelId });
  }

  /** Renders (creates or edits) the card for an update, serialized per guild. */
  handleUpdate(update: PlayerCardUpdate): void {
    const previous = this.renderChains.get(update.guildId) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(() => this.render(update.guildId, update.view))
      .catch((error: unknown) => {
        logger.error(
          { err: error, guildId: update.guildId },
          "Failed to render Player Card",
        );
      });

    this.renderChains.set(update.guildId, next);
  }

  private async render(guildId: string, view: PlayerView): Promise<void> {
    const binding = this.bindings.get(guildId);

    if (!binding || !this.client) {
      return;
    }

    const channel = await this.client.channels.fetch(binding.channelId);

    if (!channel || !channel.isTextBased() || channel.isDMBased()) {
      return;
    }

    const card = buildPlayerCard(view);
    const payload = { embeds: card.embeds, components: card.components };

    if (binding.messageId) {
      try {
        const message = await channel.messages.fetch(binding.messageId);
        await message.edit(payload);
        return;
      } catch {
        // The card message was deleted; fall through and create a new one.
      }
    }

    const sent = await channel.send(payload);
    binding.messageId = sent.id;
  }

  private async deleteMessage(
    channelId: string,
    messageId: string,
  ): Promise<void> {
    try {
      const channel = await this.client?.channels.fetch(channelId);

      if (channel && channel.isTextBased() && !channel.isDMBased()) {
        const message = await channel.messages.fetch(messageId);
        await message.delete();
      }
    } catch {
      // Best-effort cleanup — a missing old card is not an error.
    }
  }
}

export const playerCardManager = new PlayerCardManager();
