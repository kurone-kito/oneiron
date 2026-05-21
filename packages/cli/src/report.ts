import type { TeamId } from '@kurone-kito/oneiron-core';
import type { GameOutcome } from './batch.ts';

export type BatchSummary = {
  readonly games: number;
  readonly winsByTeam: ReadonlyMap<TeamId, number>;
  readonly drawCount: number;
  readonly avgRounds: number;
  readonly minRounds: number;
  readonly maxRounds: number;
  /** `null` when no outcome contained any solo team. */
  readonly soloTeamWinRate: number | null;
  readonly avgGraveyardSize: number;
  readonly avgTotalDamage: number;
};

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const value of values) sum += value;
  return sum / values.length;
}

export function summarise(outcomes: readonly GameOutcome[]): BatchSummary {
  const games = outcomes.length;
  const winsByTeam = new Map<TeamId, number>();
  let drawCount = 0;
  let minRounds = Number.POSITIVE_INFINITY;
  let maxRounds = 0;
  let soloGames = 0;
  let soloWins = 0;
  const rounds: number[] = [];
  const graveyards: number[] = [];
  const damages: number[] = [];

  for (const outcome of outcomes) {
    rounds.push(outcome.rounds);
    graveyards.push(outcome.graveyardSize);
    damages.push(outcome.totalDamageDealt);
    if (outcome.rounds < minRounds) minRounds = outcome.rounds;
    if (outcome.rounds > maxRounds) maxRounds = outcome.rounds;

    if (outcome.winner === null) {
      drawCount += 1;
    } else {
      winsByTeam.set(outcome.winner, (winsByTeam.get(outcome.winner) ?? 0) + 1);
    }

    if (outcome.soloTeams.length > 0) {
      soloGames += 1;
      if (
        outcome.winner !== null &&
        outcome.soloTeams.includes(outcome.winner)
      ) {
        soloWins += 1;
      }
    }
  }

  return {
    games,
    winsByTeam,
    drawCount,
    avgRounds: average(rounds),
    minRounds: games === 0 ? 0 : minRounds,
    maxRounds,
    soloTeamWinRate: soloGames === 0 ? null : soloWins / soloGames,
    avgGraveyardSize: average(graveyards),
    avgTotalDamage: average(damages),
  };
}

function summaryToSerializable(summary: BatchSummary): Record<string, unknown> {
  return {
    games: summary.games,
    winsByTeam: Object.fromEntries(
      [...summary.winsByTeam.entries()].sort(([a], [b]) => a - b),
    ),
    drawCount: summary.drawCount,
    avgRounds: summary.avgRounds,
    minRounds: summary.minRounds,
    maxRounds: summary.maxRounds,
    soloTeamWinRate: summary.soloTeamWinRate,
    avgGraveyardSize: summary.avgGraveyardSize,
    avgTotalDamage: summary.avgTotalDamage,
  };
}

export function formatJson(summary: BatchSummary): string {
  return JSON.stringify(summaryToSerializable(summary));
}

function csvCell(value: string | number): string {
  const str = String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function formatCsv(outcomes: readonly GameOutcome[]): string {
  const header = [
    'seed',
    'winner',
    'rounds',
    'survivingTeams',
    'totalDamageDealt',
    'graveyardSize',
    'soloTeams',
  ].join(',');
  const lines = [header];
  for (const outcome of outcomes) {
    lines.push(
      [
        csvCell(outcome.seed),
        csvCell(outcome.winner ?? ''),
        csvCell(outcome.rounds),
        csvCell(outcome.survivingTeams.join(' ')),
        csvCell(outcome.totalDamageDealt),
        csvCell(outcome.graveyardSize),
        csvCell(outcome.soloTeams.join(' ')),
      ].join(','),
    );
  }
  return lines.join('\n');
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatNumber(value: number, digits = 2): string {
  return value.toFixed(digits);
}

export function formatMarkdown(summary: BatchSummary): string {
  const drawPercent =
    summary.games === 0 ? 0 : summary.drawCount / summary.games;
  const lines: string[] = [];
  lines.push('# Batch summary', '');
  lines.push(`- **Games**: ${summary.games}`);
  lines.push(
    `- **Avg rounds**: ${formatNumber(summary.avgRounds)} (min ${summary.minRounds}, max ${summary.maxRounds})`,
  );
  lines.push(
    `- **Draws**: ${summary.drawCount} (${formatPercent(drawPercent)} of games)`,
  );
  lines.push('', '## Win rates by team number', '');
  lines.push('| Team | Wins | Win rate |');
  lines.push('| ---- | ---- | -------- |');
  const sortedWins = [...summary.winsByTeam.entries()].sort(
    ([a], [b]) => a - b,
  );
  if (sortedWins.length === 0) {
    lines.push('| _none_ | 0 | 0.00% |');
  } else {
    for (const [team, wins] of sortedWins) {
      const rate = summary.games === 0 ? 0 : wins / summary.games;
      lines.push(`| ${team} | ${wins} | ${formatPercent(rate)} |`);
    }
  }
  lines.push('', '## Solo team win rate', '');
  if (summary.soloTeamWinRate === null) {
    lines.push('_No solo teams appeared in this batch._');
  } else {
    lines.push(
      `${formatPercent(summary.soloTeamWinRate)} (across games that included a solo team)`,
    );
  }
  lines.push('', '## Card economy', '');
  lines.push(
    `- Avg graveyard size at end of game: ${formatNumber(summary.avgGraveyardSize)}`,
  );
  lines.push(
    `- Avg total damage per game: ${formatNumber(summary.avgTotalDamage)}`,
  );
  lines.push('');
  return lines.join('\n');
}
