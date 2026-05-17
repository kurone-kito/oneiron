import { describe, expect, it } from 'vitest';
import {
  chargeLife,
  createLifeToken,
  drainLife,
  isAlive,
  type NumberToken,
  type TeamId,
} from './token.ts';

describe('createLifeToken', () => {
  it('returns the value as-is for valid integer inputs', () => {
    expect(createLifeToken(0)).toBe(0);
    expect(createLifeToken(2)).toBe(2);
    expect(createLifeToken(4)).toBe(4);
  });

  it('clamps to LIFE_MIN for values below 0', () => {
    expect(createLifeToken(-1)).toBe(0);
    expect(createLifeToken(-100)).toBe(0);
  });

  it('clamps to LIFE_MAX for values above 4', () => {
    expect(createLifeToken(5)).toBe(4);
    expect(createLifeToken(100)).toBe(4);
  });

  it('rejects non-integer inputs', () => {
    expect(() => createLifeToken(1.5)).toThrow(RangeError);
  });
});

describe('isAlive', () => {
  it('returns true when life is above zero', () => {
    expect(isAlive(createLifeToken(1))).toBe(true);
    expect(isAlive(createLifeToken(4))).toBe(true);
  });

  it('returns false when life is zero', () => {
    expect(isAlive(createLifeToken(0))).toBe(false);
  });
});

describe('chargeLife', () => {
  it('adds life normally', () => {
    expect(chargeLife(createLifeToken(2), 1)).toBe(3);
  });

  it('clamps at LIFE_MAX by default', () => {
    expect(chargeLife(createLifeToken(3), 5)).toBe(4);
  });

  it('clamps at a custom max', () => {
    expect(chargeLife(createLifeToken(2), 3, 3)).toBe(3);
  });

  it('does not go below current value when n is 0', () => {
    expect(chargeLife(createLifeToken(2), 0)).toBe(2);
  });

  it('rejects invalid charge inputs', () => {
    expect(() => chargeLife(createLifeToken(2), -1)).toThrow(RangeError);
    expect(() => chargeLife(createLifeToken(0), 1, -1)).toThrow(RangeError);
    expect(() => chargeLife(createLifeToken(4), 0, 3)).toThrow(RangeError);
  });
});

describe('drainLife', () => {
  it('subtracts life normally', () => {
    expect(drainLife(createLifeToken(3), 1)).toBe(2);
  });

  it('clamps at LIFE_MIN (0)', () => {
    expect(drainLife(createLifeToken(1), 10)).toBe(0);
  });

  it('does not change value when n is 0', () => {
    expect(drainLife(createLifeToken(3), 0)).toBe(3);
  });

  it('eliminates player when drained to exactly 0', () => {
    expect(drainLife(createLifeToken(2), 2)).toBe(0);
  });

  it('rejects invalid drain amounts', () => {
    expect(() => drainLife(createLifeToken(3), -1)).toThrow(RangeError);
  });
});

describe('type exports', () => {
  it('NumberToken accepts 1–10', () => {
    const t: NumberToken = 5;
    expect(t).toBe(5);
  });
  it('TeamId is an alias for NumberToken', () => {
    const id: TeamId = 3;
    expect(id).toBe(3);
  });
});
