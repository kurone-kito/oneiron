import {
  ATTRIBUTES,
  ATTRIBUTE_EXTRACTION_MULTIPLIER,
  INITIAL_RANDOM_CARD_COUNT,
} from '../constants.mjs';
import type { Attribute, CardType } from '../types.mjs';

/** Result of {@link getVisibleCards}. */
export interface VisibleCardResult {
  /** Cards that should be shown to the user. */
  readonly visibleCards: readonly CardType[];
  /** Count of hidden cards. */
  readonly hiddenCount: number;
}

/**
 * Win conditions for the fire-water-wood relationship.
 * Fire beats wood, water beats fire, wood beats water.
 */
const win: Record<Attribute, Attribute> = {
  fire: 'wood',
  water: 'fire',
  wood: 'water',
};

/**
 * Determine advantage in the fire-water-wood relationship.
 *
 * @param a - First card.
 * @param b - Second card.
 * @returns 1 if `a` wins, -1 if `b` wins, otherwise 0.
 */
export const checkTripleAdvantage = (a: CardType, b: CardType): number => {
  if (a.type === 'joker' && b.type === 'joker') return 0;
  if (a.type === 'joker') return 1;
  if (b.type === 'joker') return -1;
  if (win[a.attribute] === b.attribute) return 1;
  if (win[b.attribute] === a.attribute) return -1;
  return 0;
};

/**
 * Compare function to sort cards by attribute and number.
 * Jokers are always placed last.
 *
 * @param a - First card.
 * @param b - Second card.
 * @returns Negative if `a` should come first.
 */
export const compareCard = (a: CardType, b: CardType): number => {
  const attributeIndex = (c: CardType) =>
    c.type === 'attribute'
      ? ATTRIBUTES.indexOf(c.attribute)
      : Number.MAX_SAFE_INTEGER;
  const num = (c: CardType) =>
    c.type === 'attribute' ? c.number : Number.MAX_SAFE_INTEGER;
  const ai = attributeIndex(a);
  const bi = attributeIndex(b);
  return ai !== bi ? ai - bi : num(a) - num(b);
};

/**
 * Calculate visible cards and hidden count for a player.
 *
 * @param cards - Player's card set.
 * @param openCount - Number of cards to reveal from the top of the deck.
 * @param hiddenLimit - Maximum number of hidden random cards.
 * @returns Visible cards sorted and remaining hidden count.
 */
export const getVisibleCards = (
  cards: readonly CardType[],
  openCount = ATTRIBUTES.length * ATTRIBUTE_EXTRACTION_MULTIPLIER,
  hiddenLimit = INITIAL_RANDOM_CARD_COUNT,
): VisibleCardResult => {
  const open = cards.slice(0, openCount);
  const hiddenCount = Math.min(hiddenLimit, cards.length - open.length);
  const rest = cards.slice(open.length + hiddenCount);
  const visibleCards = [...open, ...rest].sort(compareCard);
  return { visibleCards, hiddenCount } as const;
};
