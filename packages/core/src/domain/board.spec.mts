import { describe, expect, it } from 'vitest';
import { addForbidCoordinate } from './board.mjs';

describe('addForbidCoordinate', () => {
  it('returns new set with added coordinate', () => {
    const original = new Set([{ x: 0, y: 0 } as const]);
    const coord = { x: 1, y: 1 } as const;
    const result = addForbidCoordinate(original, coord);
    expect(result).not.toBe(original);
    expect(Array.from(result)).toContainEqual(coord);
    expect(Array.from(result)).toContainEqual({ x: 0, y: 0 });
    expect(Array.from(original)).not.toContainEqual(coord);
  });
});
