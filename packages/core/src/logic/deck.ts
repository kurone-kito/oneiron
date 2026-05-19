import type { GameConfig } from '../config.ts';
import type { Card, CardValue, Element } from '../types/card.ts';

const ELEMENTS: readonly Element[] = ['fire', 'water', 'wood'];

const CARD_VALUES: readonly CardValue[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
];

/**
 * Builds the full Dream Duels deck for a given config:
 * 3 elements × 13 values × `config.cardCopies` element cards,
 * plus exactly 2 joker cards.
 */
export function buildDeck(config: GameConfig): readonly Card[] {
  const cards: Card[] = [];
  for (let copy = 0; copy < config.cardCopies; copy++) {
    for (const element of ELEMENTS) {
      for (const value of CARD_VALUES) {
        cards.push({ kind: 'element', element, value });
      }
    }
  }
  cards.push({ kind: 'joker' });
  cards.push({ kind: 'joker' });
  return cards;
}

/**
 * Creates a deterministic pseudo-random number generator using the
 * mulberry32 algorithm. Same seed always produces the same sequence.
 */
export function createRng(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a new array containing the cards from `deck` in a
 * Fisher–Yates–shuffled order using the provided rng.
 */
export function shuffleDeck(deck: readonly Card[], rng: () => number): Card[] {
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = result[i] as Card;
    const b = result[j] as Card;
    result[i] = b;
    result[j] = a;
  }
  return result;
}
