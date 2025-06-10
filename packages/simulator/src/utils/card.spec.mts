import { describe, expect, it } from 'vitest';
import { ATTRIBUTES, CARD_DUPLICATION } from '../constants.mjs';
import { createDeck, shuffleDeck } from '../deck.mjs';
import { checkTripleAdvantage } from './card.mjs';

const fire = { attribute: 'fire', number: 1, type: 'attribute' } as const;
const water = { attribute: 'water', number: 1, type: 'attribute' } as const;
const wood = { attribute: 'wood', number: 1, type: 'attribute' } as const;
const joker = { type: 'joker' } as const;

describe('checkTripleAdvantage', () => {
  it('returns 1 when both are joker', () => {
    expect(checkTripleAdvantage(joker, joker)).toBe(0);
  });

  it('returns 1 when first is joker', () => {
    expect(checkTripleAdvantage(joker, fire)).toBe(1);
  });

  it('returns -1 when second is joker', () => {
    expect(checkTripleAdvantage(fire, joker)).toBe(-1);
  });

  it('follows rock paper scissors order', () => {
    expect(checkTripleAdvantage(fire, wood)).toBe(1);
    expect(checkTripleAdvantage(wood, water)).toBe(1);
    expect(checkTripleAdvantage(water, fire)).toBe(1);
    expect(checkTripleAdvantage(wood, fire)).toBe(-1);
  });
});

describe('deck utilities', () => {
  it('creates a full deck with jokers', () => {
    const deck = createDeck();
    const expectedSize = ATTRIBUTES.length * 13 * CARD_DUPLICATION + 2;
    expect(deck.length).toBe(expectedSize);
    expect(deck.slice(-2)).toEqual([{ type: 'joker' }, { type: 'joker' }]);
  });

  it('shuffles deterministically with custom RNG', () => {
    const deck = createDeck().slice(0, 5);
    const rng = (() => {
      let x = 1;
      return () => {
        x = (x * 16807) % 2147483647;
        return x / 2147483647;
      };
    })();
    const shuffled1 = shuffleDeck(deck, rng);
    const rng2 = (() => {
      let x = 1;
      return () => {
        x = (x * 16807) % 2147483647;
        return x / 2147483647;
      };
    })();
    const shuffled2 = shuffleDeck(deck, rng2);
    expect(shuffled1).toEqual(shuffled2);
  });

  it('does not mutate the original deck', () => {
    const deck = createDeck().slice(0, 5);
    const copy = [...deck];
    shuffleDeck(deck, () => 0);
    expect(deck).toEqual(copy);
  });
});
