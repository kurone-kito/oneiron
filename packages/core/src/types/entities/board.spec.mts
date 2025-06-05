import { describe, expectTypeOf, it } from 'vitest';
import type { Coordinate, Direction } from './board.mjs';

describe('Coordinate', () => {
  it('Coordinate === 0 | 1 | 2 | 3 | 4', () =>
    expectTypeOf<Coordinate>().toEqualTypeOf<0 | 1 | 2 | 3 | 4>());
});

describe('Direction', () => {
  it('Direction === east | north | south | west', () =>
    expectTypeOf<Direction>().toEqualTypeOf<
      'east' | 'north' | 'south' | 'west'
    >());
});
