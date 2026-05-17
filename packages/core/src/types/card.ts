/** The three elements in Dream Duels' rock-paper-scissors system. */
export type Element = 'fire' | 'water' | 'wood';

/** Numeric value printed on an element card (1–13). */
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

/** An element card with a specific element and numeric value. */
export type ElementCard = {
  readonly kind: 'element';
  readonly element: Element;
  readonly value: CardValue;
};

/** A joker card that beats any element card unconditionally. */
export type JokerCard = {
  readonly kind: 'joker';
};

/** Any card that can appear in a player's hand or deck. */
export type Card = ElementCard | JokerCard;

/** An ordered collection of cards (a player's hand or draw pile). */
export type Deck = readonly Card[];

/** Returns true when the card is an ElementCard. */
export function isElementCard(card: Card): card is ElementCard {
  return card.kind === 'element';
}

/** Returns true when the card is a JokerCard. */
export function isJokerCard(card: Card): card is JokerCard {
  return card.kind === 'joker';
}

/** Rock-paper-scissors superiority: fire > wood > water > fire. */
export const ELEMENT_BEATS: Readonly<Record<Element, Element>> = {
  fire: 'wood',
  wood: 'water',
  water: 'fire',
} as const;
