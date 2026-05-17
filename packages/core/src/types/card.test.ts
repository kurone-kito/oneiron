import { describe, expect, it } from 'vitest';
import {
  type Card,
  ELEMENT_BEATS,
  type ElementCard,
  isElementCard,
  isJokerCard,
  type JokerCard,
} from './card.ts';

const fireCard: ElementCard = { kind: 'element', element: 'fire', value: 5 };
const waterCard: ElementCard = { kind: 'element', element: 'water', value: 13 };
const woodCard: ElementCard = { kind: 'element', element: 'wood', value: 1 };
const joker: JokerCard = { kind: 'joker' };

describe('isElementCard', () => {
  it('returns true for element cards', () => {
    expect(isElementCard(fireCard)).toBe(true);
    expect(isElementCard(waterCard)).toBe(true);
    expect(isElementCard(woodCard)).toBe(true);
  });
  it('returns false for joker', () => {
    expect(isElementCard(joker)).toBe(false);
  });
});

describe('isJokerCard', () => {
  it('returns true for joker', () => {
    expect(isJokerCard(joker)).toBe(true);
  });
  it('returns false for element cards', () => {
    expect(isJokerCard(fireCard as Card)).toBe(false);
  });
});

describe('ELEMENT_BEATS', () => {
  it('fire beats wood', () => {
    expect(ELEMENT_BEATS.fire).toBe('wood');
  });
  it('wood beats water', () => {
    expect(ELEMENT_BEATS.wood).toBe('water');
  });
  it('water beats fire', () => {
    expect(ELEMENT_BEATS.water).toBe('fire');
  });
});
