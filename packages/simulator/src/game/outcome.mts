import type { ReadonlyTuple } from 'type-fest';
import type { CardType, Player, Team } from '../types.mjs';
import {
  checkTeamElimination,
  replacePlayer,
  updatePlayer,
} from './battleHelpers.mjs';

/** Context passed to outcome handlers. */
export interface BattleContext {
  readonly teams: ReadonlyTuple<Team, 2>;
  readonly players: ReadonlyTuple<Player, 2>;
  readonly indices: ReadonlyTuple<number, 2>;
  readonly prefix: string;
  readonly log: (msg: string) => void;
  readonly onDiscard: (card: CardType) => void;
}

/**
 * Update both teams with new player states.
 *
 * @param ctx - Current battle context.
 * @param players - New players for team A and B.
 * @returns Updated team tuple.
 */
export const updateTeams = (
  ctx: BattleContext,
  players: ReadonlyTuple<Player, 2>,
): ReadonlyTuple<Team, 2> => {
  const [a, b] = ctx.teams;
  const [ia, ib] = ctx.indices;
  const [pa, pb] = players;
  return [
    checkTeamElimination(replacePlayer(a, ia, pa), ctx.log),
    checkTeamElimination(replacePlayer(b, ib, pb), ctx.log),
  ];
};

/**
 * Handle case when both teams lack battle cards.
 *
 * @param ctx - Current battle context.
 * @returns Unchanged teams.
 */
export const handleNoCards = (ctx: BattleContext): ReadonlyTuple<Team, 2> => {
  ctx.log(`${ctx.prefix}両者カード不足で引き分け`);
  return ctx.teams;
};

/**
 * Handle case where one team lacks a battle card.
 *
 * @param ctx - Current battle context.
 * @param missing - Which side is missing the card.
 * @returns Updated team tuple.
 */
export const handleSingleCard = (
  ctx: BattleContext,
  missing: 'a' | 'b',
): ReadonlyTuple<Team, 2> => {
  const [pa, pb] = ctx.players;
  if (missing === 'a') {
    const np1 = updatePlayer(pa, { damage: true }, ctx.onDiscard);
    ctx.log(`${ctx.prefix}チーム${ctx.teams[1].id}の勝利 (カード不足)`);
    return updateTeams(ctx, [np1, pb]);
  }
  const np2 = updatePlayer(pb, { damage: true }, ctx.onDiscard);
  ctx.log(`${ctx.prefix}チーム${ctx.teams[0].id}の勝利 (カード不足)`);
  return updateTeams(ctx, [pa, np2]);
};

/**
 * Handle normal battle when both teams have cards.
 *
 * @param ctx - Current battle context.
 * @param cards - Chosen cards for team A and B.
 * @param result - Comparison result from {@link compareCards}.
 * @returns Updated team tuple.
 */
export const handleBothCards = (
  ctx: BattleContext,
  cards: ReadonlyTuple<CardType, 2>,
  result: number,
): ReadonlyTuple<Team, 2> => {
  const [pa, pb] = ctx.players;
  const [ca, cb] = cards;
  const np1 = updatePlayer(
    pa,
    { damage: result < 0, discard: ca },
    ctx.onDiscard,
  );
  const np2 = updatePlayer(
    pb,
    { damage: result > 0, discard: cb },
    ctx.onDiscard,
  );
  ctx.log(
    `${ctx.prefix}${result > 0 ? `チーム${ctx.teams[0].id}` : result < 0 ? `チーム${ctx.teams[1].id}` : '引き分け'}${result === 0 ? '' : 'の勝利'}`,
  );
  return updateTeams(ctx, [np1, np2]);
};
