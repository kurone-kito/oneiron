import { describe, expect, it } from 'vitest';
import type { GridCoord } from './grid.ts';
import { isAdjacent, isSameCoord, rotate } from './grid.ts';

const fireWater: GridCoord = { x: 'fire', y: 'water' };
const waterWater: GridCoord = { x: 'water', y: 'water' };
const woodWater: GridCoord = { x: 'wood', y: 'water' };
const fireWood: GridCoord = { x: 'fire', y: 'wood' };
const fireFire: GridCoord = { x: 'fire', y: 'fire' };
const waterWood: GridCoord = { x: 'water', y: 'wood' };

describe('isSameCoord', () => {
  it('returns true for identical coordinates', () => {
    expect(isSameCoord(fireWater, { x: 'fire', y: 'water' })).toBe(true);
  });
  it('returns false when x differs', () => {
    expect(isSameCoord(fireWater, waterWater)).toBe(false);
  });
  it('returns false when y differs', () => {
    expect(isSameCoord(fireWater, fireWood)).toBe(false);
  });
  it('returns false when both differ', () => {
    expect(isSameCoord(fireWater, waterWood)).toBe(false);
  });
});

describe('isAdjacent', () => {
  it('returns true when only x differs by one step', () => {
    expect(isAdjacent(fireWater, waterWater)).toBe(true);
    expect(isAdjacent(waterWater, woodWater)).toBe(true);
  });
  it('returns true when only y differs by one step', () => {
    expect(isAdjacent(fireFire, fireWater)).toBe(true);
    expect(isAdjacent(fireWater, fireWood)).toBe(true);
  });
  it('returns false for the same cell', () => {
    expect(isAdjacent(fireWater, fireWater)).toBe(false);
  });
  it('returns false for diagonal cells', () => {
    expect(isAdjacent(fireFire, waterWater)).toBe(false);
  });
  it('returns false when x distance is 2 (fire–wood)', () => {
    expect(isAdjacent(fireFire, { x: 'wood', y: 'fire' })).toBe(false);
  });
  it('returns false when y distance is 2 (fire–wood)', () => {
    expect(isAdjacent(fireFire, { x: 'fire', y: 'wood' })).toBe(false);
  });
});

describe('rotate', () => {
  it('rotates clockwise correctly through all facings', () => {
    expect(rotate('north', 'cw')).toBe('east');
    expect(rotate('east', 'cw')).toBe('south');
    expect(rotate('south', 'cw')).toBe('west');
    expect(rotate('west', 'cw')).toBe('north');
  });
  it('rotates counter-clockwise correctly through all facings', () => {
    expect(rotate('north', 'ccw')).toBe('west');
    expect(rotate('west', 'ccw')).toBe('south');
    expect(rotate('south', 'ccw')).toBe('east');
    expect(rotate('east', 'ccw')).toBe('north');
  });
  it('two cw steps equal one 180° turn', () => {
    expect(rotate(rotate('north', 'cw'), 'cw')).toBe('south');
  });
  it('cw then ccw returns to original', () => {
    expect(rotate(rotate('east', 'cw'), 'ccw')).toBe('east');
  });
});
