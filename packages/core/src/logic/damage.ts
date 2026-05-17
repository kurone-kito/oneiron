import type { Card, ElementCard } from '../types/card.ts';
import { isElementCard, isJokerCard } from '../types/card.ts';
import type { Facing, TeamState } from '../types/grid.ts';
import { ELEMENT_AXIS } from '../types/grid.ts';

/** Context supplied by the caller to describe how the encounter was won. */
export type DamageContext = {
  readonly encounterType: 'adjacent' | 'same-cell';
  /** True when the loser could not present a card (card-absence win). */
  readonly isAbsenceWin?: boolean;
};

function axisIndex(coord: string): number {
  return ELEMENT_AXIS.indexOf(coord as (typeof ELEMENT_AXIS)[number]);
}

function isPerpendicular(a: Facing, b: Facing): boolean {
  const isNS = (f: Facing) => f === 'north' || f === 'south';
  const isEW = (f: Facing) => f === 'east' || f === 'west';
  return (isNS(a) && isEW(b)) || (isEW(a) && isNS(b));
}

function isFacingToward(winner: TeamState, loser: TeamState): boolean {
  const dx = axisIndex(loser.position.x) - axisIndex(winner.position.x);
  const dy = axisIndex(loser.position.y) - axisIndex(winner.position.y);
  switch (winner.facing) {
    case 'east':
      return dx > 0;
    case 'west':
      return dx < 0;
    case 'north':
      return dy > 0;
    case 'south':
      return dy < 0;
  }
}

function facingBonus(
  winner: TeamState,
  loser: TeamState,
  encounterType: 'adjacent' | 'same-cell',
): number {
  const perp = isPerpendicular(winner.facing, loser.facing);
  if (encounterType === 'same-cell') {
    return perp ? 0 : 1;
  }
  return !perp && isFacingToward(winner, loser) ? 1 : 0;
}

function valueModifier(w: ElementCard, l: ElementCard): number {
  const wv = w.value;
  const lv = l.value;

  if (
    wv >= lv * 2 ||
    (wv === 13 && lv >= 7 && lv <= 10) ||
    (wv <= 2 && lv >= 11)
  ) {
    return 1;
  }
  if (
    lv >= wv * 2 ||
    (lv === 13 && wv >= 7 && wv <= 10) ||
    (lv <= 2 && wv >= 11)
  ) {
    return -1;
  }
  return 0;
}

/**
 * Calculates damage points dealt to the loser after an encounter.
 * Returns 1 (fixed) for joker wins or card-absence wins.
 * Otherwise: base 1 + facing bonus (0 or 1) + value modifier (−1, 0, or 1).
 * Result is clamped to a minimum of 0.
 */
export function calcDamage(
  winner: TeamState,
  loser: TeamState,
  winnerCard: Card,
  loserCard: Card,
  resolution: DamageContext,
): number {
  if (isJokerCard(winnerCard) || resolution.isAbsenceWin === true) {
    return 1;
  }

  if (!isElementCard(winnerCard) || !isElementCard(loserCard)) {
    return 1;
  }

  const base = 1;
  const facing = facingBonus(winner, loser, resolution.encounterType);
  const value = valueModifier(winnerCard, loserCard);

  return Math.max(base + facing + value, 0);
}
