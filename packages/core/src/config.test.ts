import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, type GameConfig } from './config.ts';

describe('GameConfig', () => {
  it('DEFAULT_CONFIG satisfies GameConfig shape', () => {
    const cfg: GameConfig = DEFAULT_CONFIG;
    expect(cfg).toBeDefined();
  });

  it('all fields are positive numbers', () => {
    for (const value of Object.values(DEFAULT_CONFIG)) {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    }
  });

  it('cardCopies is a positive integer', () => {
    expect(Number.isInteger(DEFAULT_CONFIG.cardCopies)).toBe(true);
    expect(DEFAULT_CONFIG.cardCopies).toBeGreaterThanOrEqual(1);
  });

  it('deckExtractFactor is a positive integer', () => {
    expect(Number.isInteger(DEFAULT_CONFIG.deckExtractFactor)).toBe(true);
    expect(DEFAULT_CONFIG.deckExtractFactor).toBeGreaterThanOrEqual(1);
  });

  it('randomCardsDealt is a non-negative integer', () => {
    expect(Number.isInteger(DEFAULT_CONFIG.randomCardsDealt)).toBe(true);
    expect(DEFAULT_CONFIG.randomCardsDealt).toBeGreaterThanOrEqual(0);
  });

  it('battleTimeLimitMin is positive', () => {
    expect(DEFAULT_CONFIG.battleTimeLimitMin).toBeGreaterThan(0);
  });

  it('damageOverflowFactor is positive', () => {
    expect(DEFAULT_CONFIG.damageOverflowFactor).toBeGreaterThan(0);
  });
});
