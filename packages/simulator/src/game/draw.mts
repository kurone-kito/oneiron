import type { CardType } from '../types.mjs';

/** Result of drawing cards from a deck. */
export interface DrawResult {
  /** Remaining deck after drawing. */
  readonly deck: CardType[];
  /** Cards drawn from the deck. */
  readonly cards: CardType[];
}

/**
 * Remove the card at the specified index from the deck.
 *
 * @param deck - Source deck.
 * @param index - Index of the card to draw.
 * @returns Updated deck and drawn card if available.
 */
export const drawAt = (
  deck: readonly CardType[],
  index: number,
): DrawResult => {
  if (index < 0 || index >= deck.length) return { deck: [...deck], cards: [] };
  const card = deck[index];
  const nextDeck = [...deck.slice(0, index), ...deck.slice(index + 1)];
  return { cards: card ? [card] : [], deck: nextDeck };
};

/**
 * Remove the first card matching predicate from the deck.
 *
 * @param deck - Source deck.
 * @param predicate - Match condition.
 * @returns Updated deck and drawn card if found.
 */
export const drawFirst = (
  deck: readonly CardType[],
  predicate: (c: CardType) => boolean,
): DrawResult => drawAt(deck, deck.findIndex(predicate));

/**
 * Draw a random card from the deck.
 *
 * @param deck - Source deck.
 * @param rng - Random generator.
 * @returns Updated deck and drawn card if available.
 */
export const drawRandom = (
  deck: readonly CardType[],
  rng: () => number = Math.random,
): DrawResult =>
  deck.length
    ? drawAt(deck, Math.floor(rng() * deck.length))
    : { deck: [], cards: [] };
