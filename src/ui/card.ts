import { type APIEmbedField, EmbedBuilder } from "discord.js";

/**
 * The shared card layout grammar. Every ZyangBot card (Player now; Queue,
 * Lyrics, Feedback, Error later) is expressed as a `CardSection` and rendered
 * through `buildCardEmbed`, so they all share one visual structure:
 *
 *   author  -> HEADER      (what is happening)
 *   title   -> PRIMARY     (the focus)
 *   description            (secondary text + PROGRESS)
 *   fields  -> METADATA    (context)
 *   footer                 (reason / help)
 *
 * This module is pure presentation — it never touches Discord I/O or business
 * logic.
 */
export type CardSection = {
  color: number;
  author?: { name: string; iconURL?: string };
  title?: string;
  url?: string;
  description?: string;
  fields?: APIEmbedField[];
  thumbnail?: string;
  footer?: string;
};

export function buildCardEmbed(section: CardSection): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(section.color);

  if (section.author) {
    embed.setAuthor({
      name: section.author.name,
      ...(section.author.iconURL ? { iconURL: section.author.iconURL } : {}),
    });
  }

  if (section.title) {
    embed.setTitle(section.title);
  }

  if (section.url) {
    embed.setURL(section.url);
  }

  if (section.description) {
    embed.setDescription(section.description);
  }

  if (section.fields && section.fields.length > 0) {
    embed.addFields(section.fields);
  }

  if (section.thumbnail) {
    embed.setThumbnail(section.thumbnail);
  }

  if (section.footer) {
    embed.setFooter({ text: section.footer });
  }

  return embed;
}
