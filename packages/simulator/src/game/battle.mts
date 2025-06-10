import type { ReadonlyTuple } from 'type-fest';
import type { CardType, Player, Team } from '../types.mjs';
import { checkTripleAdvantage } from '../utils/card.mjs';
import { cloneTeams } from './cloning.mjs';
import type { BattleContext } from './outcome.mjs';
import {
  handleBothCards,
  handleNoCards,
  handleSingleCard,
} from './outcome.mjs';

/**
 * Retrieve the first alive player from a team.
 *
 * @param team - Team to search.
 * @returns Alive player or undefined when none exist.
 */
export const getAlivePlayer = (team: Team): Player | undefined =>
  team.players.find((p) => p.isAlive);

/**
 * Compare two battle cards and determine the advantage.
 *
 * @param a - Card of team A.
 * @param b - Card of team B.
 * @returns 1 if A wins, -1 if B wins, 0 for a draw.
 */
export const compareCards = (
  a: CardType | undefined,
  b: CardType | undefined,
): number => {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;
  return checkTripleAdvantage(a, b);
};

/**
 * Find the index of the first alive player in a team.
 *
 * @param team - Team to inspect.
 * @returns Index of the alive player or -1 if none.
 */
export const findAlivePlayerIndex = (team: Team): number =>
  team.players.findIndex((p) => p.isAlive);

/**
 * Compose a battle result message.
 *
 * @param result - Comparison result.
 * @param aId - Team A id.
 * @param bId - Team B id.
 * @returns A localized message string.
 */
export const composeResultMessage = (
  result: number,
  aId: number,
  bId: number,
): string =>
  result > 0
    ? `チーム${aId}の勝利`
    : result < 0
      ? `チーム${bId}の勝利`
      : '引き分け';

/**
 * Apply battle result to teams without mutating the input teams.
 *
 * @param teams - Tuple of team A and team B.
 * @param cards - Selected cards for team A and team B.
 * @param result - Battle comparison result.
 * @param log - Logger used to record messages.
 * @returns Updated teams reflecting life loss and elimination.
 */
export const applyBattleOutcome = (
  teams: ReadonlyTuple<Team, 2>,
  cards: readonly [CardType | undefined, CardType | undefined],
  result: number,
  log: (msg: string) => void,
  onDiscard: (card: CardType) => void = () => {},
): ReadonlyTuple<Team, 2> => {
  const [origA, origB] = [...cloneTeams(teams)] as const as ReadonlyTuple<
    Team,
    2
  >;
  const [c1, c2] = cards;
  const idxA = findAlivePlayerIndex(origA);
  const idxB = findAlivePlayerIndex(origB);
  const p1 = origA.players[idxA];
  const p2 = origB.players[idxB];
  const prefix = `チーム${origA.id} vs チーム${origB.id}: `;
  if (!p1 || !p2) return [origA, origB];
  const ctx: BattleContext = {
    teams: [origA, origB],
    players: [p1, p2],
    indices: [idxA, idxB],
    prefix,
    log,
    onDiscard,
  };
  if (!c1 && !c2) {
    return handleNoCards(ctx);
  }
  if (!c1) {
    return handleSingleCard(ctx, 'a');
  }
  if (!c2) {
    return handleSingleCard(ctx, 'b');
  }
  return handleBothCards(ctx, [c1, c2], result);
};
