import { describe, expect, it } from 'vitest';
import { shouldAutoAdvance } from './helpers.mjs';

describe('shouldAutoAdvance', () => {
  it('returns true only in auto mode and non terminal phases', () => {
    expect(shouldAutoAdvance('battle', true, true)).toBe(true);
    expect(shouldAutoAdvance('setup', true, true)).toBe(false);
    expect(shouldAutoAdvance('finished', true, true)).toBe(false);
    expect(shouldAutoAdvance('battle', false, true)).toBe(false);
    expect(shouldAutoAdvance('battle', true, false)).toBe(false);
  });
});
