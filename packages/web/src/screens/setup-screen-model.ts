import type { TeamId } from '@kurone-kito/oneiron-core';
import {
  type GameConfig,
  randomStrategy,
  type TeamControl,
} from '@kurone-kito/oneiron-core';

export type SetupValues = {
  playerCount: number;
  seed: number;
  config: GameConfig;
  controls: Map<TeamId, TeamControl>;
};

export type ControlMode = 'human' | 'bot';

export type TeamSummary = {
  readonly teamId: TeamId;
  readonly memberCount: 1 | 2;
  readonly teamType: 'pair' | 'solo';
  readonly label: string;
};

const MAX_RANDOM_SEED = 2 ** 31;
export const MIN_PLAYER_COUNT = 2;
export const MAX_PLAYER_COUNT = 20;
export const MAX_STARTABLE_PLAYER_COUNT = 18;

export function clampPlayerCount(playerCount: number): number {
  const normalized = Number.isFinite(playerCount)
    ? Math.trunc(playerCount)
    : MIN_PLAYER_COUNT;
  return Math.min(MAX_PLAYER_COUNT, Math.max(MIN_PLAYER_COUNT, normalized));
}

export function createRandomSeed(now: number = Date.now()): number {
  const normalized = Math.abs(Math.trunc(now)) % MAX_RANDOM_SEED;
  return normalized === 0 ? 1 : normalized;
}

export function cloneConfig(config: GameConfig): GameConfig {
  return {
    cardCopies: config.cardCopies,
    deckExtractFactor: config.deckExtractFactor,
    randomCardsDealt: config.randomCardsDealt,
    battleTimeLimitMin: config.battleTimeLimitMin,
    damageOverflowFactor: config.damageOverflowFactor,
  };
}

export function deriveTeamSummaries(
  playerCount: number,
): readonly TeamSummary[] {
  const teams: TeamSummary[] = [];
  let remainingPlayers = clampPlayerCount(playerCount);
  let teamId = 1;

  while (remainingPlayers > 0) {
    const memberCount = remainingPlayers === 1 ? 1 : 2;
    const teamType = memberCount === 1 ? 'solo' : 'pair';
    teams.push({
      teamId: teamId as TeamId,
      memberCount,
      teamType,
      label: `Team ${teamId} (${teamType})`,
    });
    remainingPlayers -= memberCount;
    teamId += 1;
  }

  return teams;
}

export function buildControlSelections(
  teams: readonly TeamSummary[],
  previous: Readonly<Record<number, ControlMode>> = {},
): Record<number, ControlMode> {
  const next: Record<number, ControlMode> = {};
  for (const team of teams) {
    next[team.teamId] =
      previous[team.teamId] ?? (team.teamId === 1 ? 'human' : 'bot');
  }
  return next;
}

export function buildControlsMap(
  teams: readonly TeamSummary[],
  selections: Readonly<Record<number, ControlMode>>,
  seed: number,
): Map<TeamId, TeamControl> {
  return new Map(
    teams.map((team) => {
      const mode =
        selections[team.teamId] ?? (team.teamId === 1 ? 'human' : 'bot');
      return [
        team.teamId,
        mode === 'human'
          ? { type: 'human' as const }
          : {
              type: 'bot' as const,
              strategy: randomStrategy(seed + Number(team.teamId)),
            },
      ];
    }),
  );
}
