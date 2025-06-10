import type { Attribute, Direction } from '../types.mjs';

/** Mapping of card attributes to emojis. */
const attributeEmojis: Record<Attribute, string> = {
  fire: '🔥',
  water: '💧',
  wood: '🌳',
};

/** Mapping of directions to arrow emojis. */
const directionEmojis: Record<Direction, string> = {
  north: '↑',
  south: '↓',
  east: '→',
  west: '←',
};

/**
 * Convert a card attribute to a representative emoji.
 *
 * @param attr - Attribute to convert.
 * @returns Emoji string.
 */
export const getAttributeEmoji = (attr: Attribute): string =>
  attributeEmojis[attr];

/**
 * Convert a direction to an arrow emoji.
 *
 * @param d - Direction value.
 * @returns Emoji string.
 */
export const getDirectionEmoji = (d: Direction): string => directionEmojis[d];
