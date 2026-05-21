import type { TeamId } from '@kurone-kito/oneiron-core';
import { describe, expect, it } from 'vitest';
import type { GameOutcome } from './batch.ts';
import { formatCsv, formatJson, formatMarkdown, summarise } from './report.ts';

function outcome(overrides: Partial<GameOutcome> = {}): GameOutcome {
  return {
    seed: overrides.seed ?? 0,
    winner: overrides.winner ?? null,
    rounds: overrides.rounds ?? 1,
    survivingTeams: overrides.survivingTeams ?? [],
    totalDamageDealt: overrides.totalDamageDealt ?? 0,
    graveyardSize: overrides.graveyardSize ?? 0,
    soloTeams: overrides.soloTeams ?? [],
  };
}

describe('summarise', () => {
  it('counts wins, draws, and rounds correctly', () => {
    const outcomes = [
      outcome({ seed: 1, winner: 1 as TeamId, rounds: 5 }),
      outcome({ seed: 2, winner: 2 as TeamId, rounds: 7 }),
      outcome({ seed: 3, winner: 1 as TeamId, rounds: 10 }),
      outcome({ seed: 4, winner: null, rounds: 50 }),
    ];
    const summary = summarise(outcomes);
    expect(summary.games).toBe(4);
    expect(summary.winsByTeam.get(1 as TeamId)).toBe(2);
    expect(summary.winsByTeam.get(2 as TeamId)).toBe(1);
    expect(summary.drawCount).toBe(1);
    expect(summary.minRounds).toBe(5);
    expect(summary.maxRounds).toBe(50);
    expect(summary.avgRounds).toBeCloseTo((5 + 7 + 10 + 50) / 4, 5);
  });

  it('returns null soloTeamWinRate when no solo team appears', () => {
    const outcomes = [
      outcome({ winner: 1 as TeamId }),
      outcome({ winner: 2 as TeamId }),
    ];
    const summary = summarise(outcomes);
    expect(summary.soloTeamWinRate).toBeNull();
  });

  it('computes soloTeamWinRate when solo teams exist', () => {
    const outcomes = [
      outcome({ winner: 1 as TeamId, soloTeams: [1 as TeamId] }),
      outcome({ winner: 2 as TeamId, soloTeams: [1 as TeamId] }),
      outcome({ winner: null, soloTeams: [3 as TeamId] }),
    ];
    const summary = summarise(outcomes);
    // 3 games had solo teams; only the first had a solo winner.
    expect(summary.soloTeamWinRate).toBeCloseTo(1 / 3, 5);
  });

  it('averages graveyard size and total damage', () => {
    const outcomes = [
      outcome({ graveyardSize: 10, totalDamageDealt: 5 }),
      outcome({ graveyardSize: 20, totalDamageDealt: 15 }),
    ];
    const summary = summarise(outcomes);
    expect(summary.avgGraveyardSize).toBe(15);
    expect(summary.avgTotalDamage).toBe(10);
  });

  it('handles an empty outcomes list gracefully', () => {
    const summary = summarise([]);
    expect(summary.games).toBe(0);
    expect(summary.drawCount).toBe(0);
    expect(summary.minRounds).toBe(0);
    expect(summary.maxRounds).toBe(0);
    expect(summary.avgRounds).toBe(0);
    expect(summary.soloTeamWinRate).toBeNull();
  });
});

describe('formatJson', () => {
  it('emits a JSON document that round-trips through JSON.parse', () => {
    const summary = summarise([
      outcome({ winner: 1 as TeamId, rounds: 4 }),
      outcome({ winner: 1 as TeamId, rounds: 6 }),
    ]);
    const json = formatJson(summary);
    const parsed = JSON.parse(json) as {
      games: number;
      winsByTeam: Record<string, number>;
    };
    expect(parsed.games).toBe(2);
    expect(parsed.winsByTeam['1']).toBe(2);
  });
});

describe('formatCsv', () => {
  it('emits a header row and one line per outcome', () => {
    const outcomes = [
      outcome({
        seed: 1,
        winner: 1 as TeamId,
        rounds: 5,
        survivingTeams: [1 as TeamId],
        totalDamageDealt: 3,
        graveyardSize: 12,
        soloTeams: [1 as TeamId, 2 as TeamId],
      }),
      outcome({ seed: 2, winner: null, rounds: 50 }),
    ];
    const csv = formatCsv(outcomes);
    const lines = csv.split('\n');
    expect(lines[0]).toBe(
      'seed,winner,rounds,survivingTeams,totalDamageDealt,graveyardSize,soloTeams',
    );
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe('1,1,5,1,3,12,1 2');
    expect(lines[2]).toBe('2,,50,,0,0,');
  });
});

describe('formatMarkdown', () => {
  it('contains the required sections and renders win-rate rows', () => {
    const summary = summarise([
      outcome({ winner: 1 as TeamId, rounds: 5, soloTeams: [1 as TeamId] }),
      outcome({ winner: 2 as TeamId, rounds: 10, soloTeams: [3 as TeamId] }),
      outcome({ winner: null, rounds: 50 }),
    ]);
    const md = formatMarkdown(summary);
    expect(md).toContain('# Batch summary');
    expect(md).toContain('## Win rates by team number');
    expect(md).toContain('## Solo team win rate');
    expect(md).toContain('## Card economy');
    expect(md).toMatch(/\| 1 \| 1 \| 33\.33% \|/);
    expect(md).toMatch(/\| 2 \| 1 \| 33\.33% \|/);
  });

  it('notes the absence of solo teams when none are present', () => {
    const summary = summarise([outcome({ winner: 1 as TeamId })]);
    const md = formatMarkdown(summary);
    expect(md).toContain('No solo teams appeared in this batch.');
  });
});
