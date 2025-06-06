import { describe, expect, it } from 'vitest';
import { clamp } from './clamp.mjs';

describe('clamp', () => {
  it.each([
    [2, 12, 1, 2],
    [2, 12, 6, 6],
    [2, 12, 20, 12],
  ])('clamp(%d, %d, %d) -> %d', (min, max, value, expected) => {
    expect(clamp(min, max, value)).toBe(expected);
  });
});
