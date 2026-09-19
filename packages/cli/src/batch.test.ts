import { describe, expect, it } from 'vitest';
import { runBatch } from './batch.ts';

describe('runBatch', () => {
  it('returns one outcome per game', () => {
    const { outcomes } = runBatch({
      playerCount: 4,
      seedStart: 1,
      gameCount: 10,
    });
    expect(outcomes).toHaveLength(10);
    for (const outcome of outcomes) {
      expect(outcome.seed).toBeGreaterThanOrEqual(1);
      expect(outcome.rounds).toBeGreaterThan(0);
      expect(outcome.rounds).toBeLessThanOrEqual(50);
      expect(outcome.totalDamageDealt).toBeGreaterThanOrEqual(0);
      expect(outcome.graveyardSize).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(outcome.survivingTeams)).toBe(true);
    }
  });

  it('uses consecutive seeds starting at seedStart', () => {
    const { outcomes } = runBatch({
      playerCount: 4,
      seedStart: 100,
      gameCount: 5,
    });
    expect(outcomes.map((o) => o.seed)).toEqual([100, 101, 102, 103, 104]);
  });

  it('is deterministic for the same input', () => {
    const input = {
      playerCount: 4,
      seedStart: 42,
      gameCount: 5,
      strategySeed: 7,
    } as const;
    const first = runBatch(input);
    const second = runBatch(input);
    expect(first).toEqual(second);
  });

  it('respects maxRoundsPerGame as an upper bound', () => {
    const { outcomes } = runBatch({
      playerCount: 6,
      seedStart: 1,
      gameCount: 5,
      maxRoundsPerGame: 10,
    });
    expect(outcomes).toHaveLength(5);
    for (const outcome of outcomes) {
      expect(outcome.rounds).toBeLessThanOrEqual(10);
    }
  });

  it('marks a clear winner when only one team survives', () => {
    const { outcomes } = runBatch({
      playerCount: 4,
      seedStart: 1,
      gameCount: 20,
    });
    for (const outcome of outcomes) {
      if (outcome.winner !== null) {
        expect(outcome.survivingTeams).toContain(outcome.winner);
      }
    }
  });

  it('changing strategySeed changes outcomes', () => {
    const a = runBatch({
      playerCount: 4,
      seedStart: 1,
      gameCount: 3,
      strategySeed: 0,
    });
    const b = runBatch({
      playerCount: 4,
      seedStart: 1,
      gameCount: 3,
      strategySeed: 999,
    });
    expect(a).not.toEqual(b);
  });

  it('flags hitRoundCap consistently with winner and survivingTeams', () => {
    const { outcomes } = runBatch({
      playerCount: 6,
      seedStart: 1,
      gameCount: 30,
      maxRoundsPerGame: 5,
    });
    for (const outcome of outcomes) {
      if (outcome.winner !== null) {
        expect(outcome.hitRoundCap).toBe(false);
        expect(outcome.survivingTeams).toHaveLength(1);
      } else if (outcome.hitRoundCap) {
        expect(outcome.survivingTeams.length).toBeGreaterThan(1);
      } else {
        expect(outcome.survivingTeams).toHaveLength(0);
      }
    }
    // A 5-round cap over 6 teams is short enough that at least one of
    // 30 games should still be undecided when the cap lands.
    expect(outcomes.some((o) => o.hitRoundCap)).toBe(true);
  });

  it("derives each game's strategy seed from its index, so games do not share one RNG stream", () => {
    // Game index 1 of a 2-game batch must behave exactly like a
    // standalone 1-game batch seeded with the same setup seed and the
    // same derived strategy seed (strategySeed + index * 1_000_000).
    const combined = runBatch({
      playerCount: 6,
      seedStart: 1,
      gameCount: 2,
      strategySeed: 5,
    });
    const secondAlone = runBatch({
      playerCount: 6,
      seedStart: 2,
      gameCount: 1,
      strategySeed: 5 + 1_000_000,
    });
    expect(combined.outcomes[1]).toEqual(secondAlone.outcomes[0]);
  });
});
