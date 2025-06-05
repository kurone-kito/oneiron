import { describe, expectTypeOf, it } from 'vitest';
import type { Rank, Suit } from './card.mjs';

describe('Rank', () => {
  it('Rank === 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13', () =>
    expectTypeOf<Rank>().toEqualTypeOf<
      1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13
    >());
});

describe('Suit', () => {
  it('Suit === fire | water | wood', () =>
    expectTypeOf<Suit>().toEqualTypeOf<'fire' | 'water' | 'wood'>());
});
