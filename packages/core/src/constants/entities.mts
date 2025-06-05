import type { ReadonlyRecord, Suit } from '../index.mjs';

/** The direction constants. */
export const directions = ['east', 'north', 'south', 'west'] as const;

/** The suit constants. */
export const suits = ['fire', 'water', 'wood'] as const;

/** The phase constants. */
export const phases = ['battle', 'forbidden', 'movement', 'revive'] as const;

/**
 * The suit dominance map.
 *
 * Each suit dominates the suit specified as its value.
 */
export const dominance = {
  fire: 'wood',
  wood: 'water',
  water: 'fire',
} as const as ReadonlyRecord<Suit, Suit>;
