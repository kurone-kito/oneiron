import { describe, expect, it } from 'vitest';
import {
  clampPlayerCount,
  createRandomSeed,
  deriveSetupConfigLimits,
  MAX_CARD_COPIES,
  MAX_SETUP_SEED,
  MIN_PLAYER_COUNT,
  MIN_SETUP_SEED,
  normalizeSeed,
  normalizeSetupConfig,
} from './setup-screen-model.ts';

describe('clampPlayerCount', () => {
  it('falls back to the minimum when given NaN', () => {
    expect(clampPlayerCount(Number.NaN)).toBe(MIN_PLAYER_COUNT);
  });

  it('falls back to the minimum when given infinities', () => {
    expect(clampPlayerCount(Number.POSITIVE_INFINITY)).toBe(MIN_PLAYER_COUNT);
    expect(clampPlayerCount(Number.NEGATIVE_INFINITY)).toBe(MIN_PLAYER_COUNT);
  });
});

describe('normalizeSeed', () => {
  it('falls back for non-finite values and clamps to the signed 32-bit range', () => {
    expect(normalizeSeed(Number.POSITIVE_INFINITY, 7)).toBe(7);
    expect(normalizeSeed(Number.NEGATIVE_INFINITY, 7)).toBe(7);
    expect(normalizeSeed(2 ** 40)).toBe(MAX_SETUP_SEED);
    expect(normalizeSeed(-(2 ** 40))).toBe(MIN_SETUP_SEED);
  });
});

describe('createRandomSeed', () => {
  it('maps zero and full-cycle timestamps to 1', () => {
    expect(createRandomSeed(0)).toBe(1);
    expect(createRandomSeed(2 ** 31)).toBe(1);
  });
});

describe('normalizeSetupConfig', () => {
  it('caps setup-heavy values to the current deck budget', () => {
    const normalized = normalizeSetupConfig(
      {
        cardCopies: 10_000,
        deckExtractFactor: 10_000,
        randomCardsDealt: 10_000,
        battleTimeLimitMin: 9,
        damageOverflowFactor: 11,
      },
      18,
    );
    const limits = deriveSetupConfigLimits(18, normalized);

    expect(normalized.cardCopies).toBe(MAX_CARD_COPIES);
    expect(normalized.deckExtractFactor).toBe(limits.deckExtractFactor);
    expect(normalized.randomCardsDealt).toBe(limits.randomCardsDealt);
    expect(normalized.battleTimeLimitMin).toBe(9);
    expect(normalized.damageOverflowFactor).toBe(11);
  });
});
