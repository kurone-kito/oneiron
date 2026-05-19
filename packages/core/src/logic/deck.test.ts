import { describe, expect, it } from 'vitest';
import type { GameConfig } from '../config.ts';
import { DEFAULT_CONFIG } from '../config.ts';
import { isJokerCard } from '../types/card.ts';
import { buildDeck, createRng, shuffleDeck } from './deck.ts';

const configWith = (cardCopies: number): GameConfig => ({
  ...DEFAULT_CONFIG,
  cardCopies,
});

describe('buildDeck', () => {
  it('returns 80 cards for DEFAULT_CONFIG (cardCopies=2)', () => {
    const deck = buildDeck(DEFAULT_CONFIG);
    expect(deck).toHaveLength(80);
  });

  it('returns 41 cards for cardCopies=1', () => {
    const deck = buildDeck(configWith(1));
    expect(deck).toHaveLength(3 * 13 * 1 + 2);
  });

  it('returns 119 cards for cardCopies=3', () => {
    const deck = buildDeck(configWith(3));
    expect(deck).toHaveLength(3 * 13 * 3 + 2);
  });

  it('always includes exactly 2 jokers', () => {
    const deck = buildDeck(DEFAULT_CONFIG);
    const jokers = deck.filter(isJokerCard);
    expect(jokers).toHaveLength(2);
  });

  it('includes equal counts per element', () => {
    const deck = buildDeck(DEFAULT_CONFIG);
    const counts = { fire: 0, water: 0, wood: 0 };
    for (const card of deck) {
      if (card.kind === 'element') counts[card.element] += 1;
    }
    expect(counts.fire).toBe(26);
    expect(counts.water).toBe(26);
    expect(counts.wood).toBe(26);
  });

  it('includes all values 1..13 for each element', () => {
    const deck = buildDeck(configWith(1));
    const fireValues = deck
      .filter((c) => c.kind === 'element' && c.element === 'fire')
      .map((c) => (c.kind === 'element' ? c.value : 0))
      .sort((a, b) => a - b);
    expect(fireValues).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  });
});

describe('createRng', () => {
  it('returns the same sequence for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = [a(), a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('returns different sequences for different seeds', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a()).not.toBe(b());
  });

  it('produces values in [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('shuffleDeck', () => {
  it('returns a permutation of the input (same multiset)', () => {
    const deck = buildDeck(configWith(1));
    const shuffled = shuffleDeck(deck, createRng(5));
    expect(shuffled).toHaveLength(deck.length);
    // Same card count by kind
    expect(shuffled.filter(isJokerCard)).toHaveLength(2);
  });

  it('does not mutate the input', () => {
    const deck = buildDeck(configWith(1));
    const original = [...deck];
    shuffleDeck(deck, createRng(0));
    expect(deck).toEqual(original);
  });

  it('produces the same order for the same seed', () => {
    const deck = buildDeck(DEFAULT_CONFIG);
    const a = shuffleDeck(deck, createRng(123));
    const b = shuffleDeck(deck, createRng(123));
    expect(a).toEqual(b);
  });

  it('produces a different order for different seeds (with high probability)', () => {
    const deck = buildDeck(DEFAULT_CONFIG);
    const a = shuffleDeck(deck, createRng(1));
    const b = shuffleDeck(deck, createRng(2));
    // Two random shuffles of an 80-card deck are very unlikely to be identical
    expect(a).not.toEqual(b);
  });
});
