import { dominance, suits } from '../constants/entities.mjs';
import type { Card, Rank, Suit } from '../types/entities/card.mjs';
import { createId } from './object.mjs';

/**
 * Determines whether the first suit dominates the second.
 * @param a The first suit.
 * @param b The second suit.
 * @returns `true` if the first suit dominates the second, otherwise `false`.
 */
export const dominates = (a: Suit, b: Suit): boolean => dominance[a] === b;

/**
 * Compares two cards from the perspective of the first card.
 * @param a The first card.
 * @param b The second card.
 * @returns 'win' if the first card wins, 'lose' if it loses,
 * or 'draw' if they are equal.
 */
export const compareCard = (a: Card, b: Card): 'win' | 'lose' | 'draw' => {
  if (a.type === 'joker' && b.type !== 'joker') return 'win';
  if (b.type === 'joker' && a.type !== 'joker') return 'lose';
  if (a.type === 'pip' && b.type === 'pip') {
    if (dominates(a.suit, b.suit)) return 'win';
    if (dominates(b.suit, a.suit)) return 'lose';
  }
  return 'draw';
};

/**
 * Creates a new deck of 41 cards.
 * @returns A new deck of cards.
 */
export const createDeck = (): readonly Card[] => [
  ...suits.flatMap((suit) =>
    Array.from({ length: 13 }, (_, i) => ({
      id: createId(),
      type: 'pip' as const,
      suit,
      rank: (i + 1) as Rank,
    })),
  ),
  { id: createId(), type: 'joker' },
  { id: createId(), type: 'joker' },
];

/**
 * Returns a new array with the same elements in randomized order.
 * @template T The type of the elements in the array.
 * @param values The array to shuffle.
 * @returns A new array with the elements shuffled.
 */
export const shuffle = <T,>(values: readonly T[]): readonly T[] =>
  [...values].sort(() => Math.random() * 2 - 1);
