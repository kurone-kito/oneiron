import { describe, expect, it } from 'vitest';
import type { Card } from '../types/entities/card.mjs';
import type { Id } from '../types/entities/object.mjs';
import { compareCard, createDeck, dominates, shuffle } from './card.mjs';

describe('dominates', () => {
  it.each([
    ['fire', 'wood', true],
    ['wood', 'water', true],
    ['water', 'fire', true],
    ['wood', 'fire', false],
    ['water', 'wood', false],
    ['fire', 'water', false],
  ] as const)('dominates(%s, %s) === %s', (a, b, expected) =>
    expect(dominates(a, b)).toBe(expected),
  );
});

describe('compareCard', () => {
  const joker = { id: 'j' as Id, type: 'joker' } as const satisfies Card;
  const fire2 = {
    id: 'f2' as Id,
    type: 'pip',
    rank: 2,
    suit: 'fire',
  } as const satisfies Card;
  const wood2 = {
    id: 'w2' as Id,
    type: 'pip',
    rank: 2,
    suit: 'wood',
  } as const satisfies Card;
  it('joker beats pip', () => {
    expect(compareCard(joker, fire2)).toBe('win');
    expect(compareCard(fire2, joker)).toBe('lose');
  });
  it('uses dominance for pips', () => {
    expect(compareCard(fire2, wood2)).toBe('win');
    expect(compareCard(wood2, fire2)).toBe('lose');
  });
  it('returns draw when equal', () => {
    expect(compareCard(joker, joker)).toBe('draw');
    expect(compareCard(fire2, { ...fire2, id: 'f3' as Id })).toBe('draw');
  });
});

describe('createDeck', () => {
  it('creates a deck with 41 cards', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(41);
    const jokers = deck.filter((c) => c.type === 'joker');
    expect(jokers).toHaveLength(2);
  });
});

describe('shuffle', () => {
  it('returns new array with same elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffle(arr);
    expect(result).toHaveLength(arr.length);
    expect(new Set(result)).toEqual(new Set(arr));
    expect(result).not.toBe(arr);
  });
});
