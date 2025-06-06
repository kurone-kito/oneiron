import { describe, expect, it } from 'vitest';
import { directions, dominance, phases, suits } from './entities.mjs';

describe('constants', () => {
  it('exports directions', () =>
    expect(directions).toEqual(['east', 'north', 'south', 'west']));
  it('exports suits', () => expect(suits).toEqual(['fire', 'water', 'wood']));
  it('exports phases', () =>
    expect(phases).toEqual(['battle', 'forbidden', 'movement', 'revive']));
  it('exports dominance map', () =>
    expect(dominance).toEqual({ fire: 'wood', wood: 'water', water: 'fire' }));
});
