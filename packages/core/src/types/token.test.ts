import { describe, expect, it } from 'vitest';
import {
  chargeLife,
  createLifeToken,
  drainLife,
  isAlive,
  LIFE_MAX,
  LIFE_MIN,
  type LifeToken,
  type NumberToken,
  type TeamId,
} from './token.ts';

describe('createLifeToken', () => {
  it('returns the value as-is for valid inputs', () => {
    expect(createLifeToken(0)).toBe(0);
    expect(createLifeToken(2)).toBe(2);
    expect(createLifeToken(4)).toBe(4);
  });
  it('clamps to LIFE_MIN for values below 0', () => {
    expect(createLifeToken(-1)).toBe(LIFE_MIN);
    expect(createLifeToken(-100)).toBe(LIFE_MIN);
  });
  it('clamps to LIFE_MAX for values above 4', () => {
    expect(createLifeToken(5)).toBe(LIFE_MAX);
    expect(createLifeToken(100)).toBe(LIFE_MAX);
  });
});

describe('isAlive', () => {
  it('returns true when life is above zero', () => {
    expect(isAlive(1 as LifeToken)).toBe(true);
    expect(isAlive(4 as LifeToken)).toBe(true);
  });
  it('returns false when life is zero', () => {
    expect(isAlive(0 as LifeToken)).toBe(false);
  });
});

describe('chargeLife', () => {
  it('adds life normally', () => {
    expect(chargeLife(2 as LifeToken, 1)).toBe(3);
  });
  it('clamps at LIFE_MAX by default', () => {
    expect(chargeLife(3 as LifeToken, 5)).toBe(LIFE_MAX);
  });
  it('clamps at a custom max', () => {
    expect(chargeLife(2 as LifeToken, 3, 3 as LifeToken)).toBe(3);
  });
  it('does not go below current value when n is 0', () => {
    expect(chargeLife(2 as LifeToken, 0)).toBe(2);
  });
});

describe('drainLife', () => {
  it('subtracts life normally', () => {
    expect(drainLife(3 as LifeToken, 1)).toBe(2);
  });
  it('clamps at LIFE_MIN (0)', () => {
    expect(drainLife(1 as LifeToken, 10)).toBe(LIFE_MIN);
  });
  it('does not change value when n is 0', () => {
    expect(drainLife(3 as LifeToken, 0)).toBe(3);
  });
  it('eliminates player when drained to exactly 0', () => {
    expect(drainLife(2 as LifeToken, 2)).toBe(0);
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
