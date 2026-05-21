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
const ELEMENT_VALUES_PER_COPY = 13;
const ELEMENT_COUNT = 3;
const JOKER_COUNT = 2;
const SETUP_ELEMENT_BUFFER = 2;
const SETUP_JOKER_DRAW_COUNT = 1;
const MAX_SAFE_SETUP_DECK_SIZE = 1024;

export const MIN_PLAYER_COUNT = 2;
export const MAX_PLAYER_COUNT = 20;
export const MAX_STARTABLE_PLAYER_COUNT = 18;
export const MIN_SETUP_SEED = -(2 ** 31);
export const MAX_SETUP_SEED = MAX_RANDOM_SEED - 1;
export const MAX_CARD_COPIES = Math.floor(
  (MAX_SAFE_SETUP_DECK_SIZE - JOKER_COUNT) /
    (ELEMENT_COUNT * ELEMENT_VALUES_PER_COPY),
);

export type SetupConfigLimits = Readonly<Record<keyof GameConfig, number>>;

function clampInteger(
  value: number,
  minimum: number,
  maximum: number,
  fallback: number,
): number {
  const normalized = Number.isFinite(value) ? Math.trunc(value) : fallback;
  return Math.min(maximum, Math.max(minimum, normalized));
}

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

export function normalizeSeed(seed: number, fallback: number = 1): number {
  const safeFallback = Number.isFinite(fallback) ? Math.trunc(fallback) : 1;
  return clampInteger(seed, MIN_SETUP_SEED, MAX_SETUP_SEED, safeFallback);
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

function buildDeckSize(cardCopies: number): number {
  return ELEMENT_COUNT * ELEMENT_VALUES_PER_COPY * cardCopies + JOKER_COUNT;
}

export function deriveSetupConfigLimits(
  playerCount: number,
  config: GameConfig,
): SetupConfigLimits {
  const teamCount = deriveTeamSummaries(playerCount).length;
  const cardCopies = clampInteger(config.cardCopies, 1, MAX_CARD_COPIES, 1);
  const maxDeckExtractFactor = Math.max(
    1,
    Math.floor(
      (ELEMENT_VALUES_PER_COPY * cardCopies - SETUP_ELEMENT_BUFFER) / teamCount,
    ),
  );
  const deckExtractFactor = clampInteger(
    config.deckExtractFactor,
    1,
    maxDeckExtractFactor,
    1,
  );
  const remainingAfterSetup =
    buildDeckSize(cardCopies) -
    (ELEMENT_COUNT * (teamCount * deckExtractFactor + SETUP_ELEMENT_BUFFER) +
      SETUP_JOKER_DRAW_COUNT);
  return {
    cardCopies: MAX_CARD_COPIES,
    deckExtractFactor: maxDeckExtractFactor,
    randomCardsDealt: Math.max(0, Math.floor(remainingAfterSetup / teamCount)),
    battleTimeLimitMin: MAX_SETUP_SEED,
    damageOverflowFactor: MAX_SETUP_SEED,
  };
}

export function normalizeSetupConfig(
  config: GameConfig,
  playerCount: number,
): GameConfig {
  const cardCopies = clampInteger(config.cardCopies, 1, MAX_CARD_COPIES, 1);
  const provisionalConfig = {
    ...config,
    cardCopies,
  };
  const deckExtractFactor = clampInteger(
    config.deckExtractFactor,
    1,
    deriveSetupConfigLimits(playerCount, provisionalConfig).deckExtractFactor,
    1,
  );
  const limits = deriveSetupConfigLimits(playerCount, {
    ...provisionalConfig,
    deckExtractFactor,
  });
  return {
    cardCopies,
    deckExtractFactor,
    randomCardsDealt: clampInteger(
      config.randomCardsDealt,
      0,
      limits.randomCardsDealt,
      0,
    ),
    battleTimeLimitMin: clampInteger(
      config.battleTimeLimitMin,
      1,
      limits.battleTimeLimitMin,
      1,
    ),
    damageOverflowFactor: clampInteger(
      config.damageOverflowFactor,
      1,
      limits.damageOverflowFactor,
      1,
    ),
  };
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
