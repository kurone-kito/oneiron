import type { ReadonlyTuple } from 'type-fest';
import type { CardType, Team } from '../types.mjs';
import { applyBattleOutcome, compareCards, getAlivePlayer } from './battle.mjs';
import { selectBattleCard } from './battleHelpers.mjs';
import { cloneTeams } from './cloning.mjs';
import { createLogCollector } from './logCollector.mjs';

/** Type definition for the result of a battle simulation. */
export interface BattleResult {
  /** Updated teams after the battle. */
  readonly teams: ReadonlyTuple<Team, 2>;
  /** Logs describing the battle flow. */
  readonly logs: readonly string[];
}

/** Result of resolving all encounters in a battle phase. */
export interface EncountersResult {
  /** Updated teams after all battles. */
  readonly teams: Team[];
  /** Aggregated battle logs. */
  readonly logs: string[];
}

/** Tuple associating a team id with its updated instance. */
export type TeamUpdate = readonly [id: number, team: Team];

/**
 * Apply team updates to the original team array without mutation.
 *
 * @param teams - Base team list.
 * @param updates - Updated teams keyed by id.
 * @returns New array reflecting the updates.
 */
export const applyTeamUpdates = (
  teams: readonly Team[],
  updates: readonly TeamUpdate[],
): Team[] => {
  const idMap = new Map<number, Team>([
    ...teams.map((t) => [t.id, t] as const),
    ...updates,
  ]);
  return teams.map((t) => idMap.get(t.id) ?? t);
};

/**
 * Simulate all encounter pairs and collect team updates.
 *
 * @param pairs - Encounter pairs.
 * @param simulate - Battle simulation function.
 * @param log - Logger invoked on each message.
 * @param onDiscard - Discard callback.
 * @returns List of updated teams keyed by id.
 */
export const simulatePairs = (
  pairs: readonly ReadonlyTuple<Team, 2>[],
  simulate: typeof simulateBattle,
  log: (msg: string) => void,
  onDiscard: (card: CardType) => void,
): TeamUpdate[] =>
  pairs.flatMap(([a, b]) => {
    const {
      teams: [na, nb],
    } = simulate(a, b, log, onDiscard);
    return [[a.id, na] as const, [b.id, nb] as const];
  });

/**
 * Apply battle results for each encounter pair.
 *
 * @param teams - Teams participating in encounters.
 * @param pairs - Encounter pairs.
 * @param simulate - Battle simulation function.
 * @param log - Logger invoked on each message.
 * @param onDiscard - Discard callback.
 * @returns New team array after applying all battles.
 */
export const resolvePairs = (
  teams: readonly Team[],
  pairs: readonly ReadonlyTuple<Team, 2>[],
  simulate: typeof simulateBattle,
  log: (msg: string) => void,
  onDiscard: (card: CardType) => void,
): Team[] => {
  if (!pairs.length) {
    log('エンカウントは発生しませんでした');
    return [...teams];
  }
  log(`${pairs.length}組のエンカウントが発生！`);
  const updates = simulatePairs(pairs, simulate, log, onDiscard);
  return applyTeamUpdates(teams, updates);
};

/**
 * Determine whether two teams are adjacent or on the same cell.
 *
 * @param a - First team.
 * @param b - Second team.
 * @returns True if the teams should battle.
 */
export const areTeamsAdjacent = (a: Team, b: Team): boolean => {
  const dx = Math.abs(a.position.x - b.position.x);
  const dy = Math.abs(a.position.y - b.position.y);
  return (!dx && !dy) || (dx + dy === 1 && (dx === 1 || dy === 1));
};

/**
 * Simulate a single battle between two teams.
 *
 * @param a - Team A.
 * @param b - Team B.
 * @param logger - Optional logger invoked for each battle log.
 * @returns Updated teams and battle logs.
 */
export const simulateBattle = (
  a: Team,
  b: Team,
  logger: (msg: string) => void = () => {},
  onDiscard: (card: CardType) => void = () => {},
): BattleResult => {
  const logs: string[] = [];
  const log = (msg: string) => {
    logs.push(msg);
    logger(msg);
  };
  const p1 = getAlivePlayer(a);
  const p2 = getAlivePlayer(b);
  if (!p1 || !p2) {
    return {
      teams: [...cloneTeams([a, b])] as const as ReadonlyTuple<Team, 2>,
      logs,
    };
  }
  const c1 = selectBattleCard(p1);
  const c2 = selectBattleCard(p2);
  const result = compareCards(c1, c2);
  const [teamA, teamB] = applyBattleOutcome(
    [a, b],
    [c1, c2],
    result,
    log,
    onDiscard,
  );
  return { teams: [teamA, teamB], logs };
};

/**
 * Find pairs of teams that are adjacent or occupying the same cell.
 *
 * This implementation recursively groups teams without mutating the input
 * array, resulting in a purely functional algorithm.
 *
 * @param teams - All teams in the current game.
 * @returns Array of encounter pairs.
 */
export const findEncounterPairs = (
  teams: readonly Team[],
): readonly ReadonlyTuple<Team, 2>[] => {
  const alive = teams.filter((t) => !t.isEliminated);
  const pair = (
    remaining: readonly Team[],
    result: ReadonlyTuple<Team, 2>[],
  ): ReadonlyTuple<Team, 2>[] => {
    if (remaining.length < 2) return result;
    const [head, ...tail] = remaining as readonly [Team, ...Team[]];
    const idx = tail.findIndex((other) => areTeamsAdjacent(head, other));
    if (idx === -1) return pair(tail, result);
    const partner = tail[idx] as Team;
    const rest = [...tail.slice(0, idx), ...tail.slice(idx + 1)];
    return pair(rest, [...result, [head, partner] as ReadonlyTuple<Team, 2>]);
  };
  return pair(alive, []);
};

/**
 * Resolve encounters for the given teams using injected helpers.
 *
 * This function does not mutate the provided team array.
 *
 * @param teams - Teams participating in battle.
 * @param logger - Callback invoked for each log message.
 * @param options - Optional helpers for testing.
 * @returns Updated teams and collected logs.
 */
export const resolveEncounters = (
  teams: readonly Team[],
  logger: (msg: string) => void = () => {},
  {
    findPairs = findEncounterPairs,
    simulate = simulateBattle,
    onDiscard = () => {},
  }: {
    findPairs?: typeof findEncounterPairs;
    simulate?: typeof simulateBattle;
    onDiscard?: (card: CardType) => void;
  } = {},
): EncountersResult => {
  const { log, getLogs } = createLogCollector(logger);
  const pairs = findPairs(teams);
  const updated = resolvePairs(teams, pairs, simulate, log, onDiscard);
  return { teams: updated, logs: getLogs() };
};
