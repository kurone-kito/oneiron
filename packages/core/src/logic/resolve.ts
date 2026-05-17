import type { Card } from '../types/card.ts';
import { ELEMENT_BEATS, isElementCard, isJokerCard } from '../types/card.ts';

/** Outcome of a card-vs-card comparison from player A's perspective. */
export type ResolutionResult = 'a' | 'b' | 'draw';

/**
 * Resolves which card wins in a head-to-head encounter.
 *
 * Rules:
 * - Joker beats any ElementCard; Joker vs Joker is a draw.
 * - Element vs Element: fire > wood > water > fire; same element is a draw.
 *
 * Returns 'a' if card a wins, 'b' if card b wins, 'draw' otherwise.
 */
export function resolveCards(a: Card, b: Card): ResolutionResult {
  const aIsJoker = isJokerCard(a);
  const bIsJoker = isJokerCard(b);

  if (aIsJoker && bIsJoker) {
    return 'draw';
  }
  if (aIsJoker) {
    return 'a';
  }
  if (bIsJoker) {
    return 'b';
  }

  if (isElementCard(a) && isElementCard(b)) {
    if (ELEMENT_BEATS[a.element] === b.element) {
      return 'a';
    }
    if (ELEMENT_BEATS[b.element] === a.element) {
      return 'b';
    }
    return 'draw';
  }

  return 'draw';
}
