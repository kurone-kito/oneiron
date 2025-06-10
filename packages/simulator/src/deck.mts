import { ATTRIBUTES, CARD_DUPLICATION } from './constants.mjs';
import type { CardType } from './types.mjs';

/**
 * Generate a new deck including two jokers.
 * @returns A full deck of cards.
 */
export const createDeck = (): readonly CardType[] => [
  ...ATTRIBUTES.flatMap((attribute) =>
    Array.from(
      { length: 13 * CARD_DUPLICATION },
      (_, i) =>
        ({
          attribute,
          number: Math.floor(i / CARD_DUPLICATION) + 1,
          type: 'attribute',
        }) as const,
    ),
  ),
  { type: 'joker' },
  { type: 'joker' },
];

/**
 * Shuffle a deck without mutating the input array.
 * @param src - Source deck.
 * @param rng - Random number generator.
 * @returns Shuffled deck.
 */
export const shuffleDeck = (
  src: readonly CardType[],
  rng: () => number = Math.random,
): CardType[] =>
  src.reduce<CardType[]>((shuffled, card) => {
    const index = Math.floor(rng() * (shuffled.length + 1));
    return [...shuffled.slice(0, index), card, ...shuffled.slice(index)];
  }, []);
