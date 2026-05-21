import { describe, expect, it } from 'vitest';
import { clampPlayerCount, MIN_PLAYER_COUNT } from './setup-screen-model.ts';

describe('clampPlayerCount', () => {
  it('falls back to the minimum when given NaN', () => {
    expect(clampPlayerCount(Number.NaN)).toBe(MIN_PLAYER_COUNT);
  });
});
