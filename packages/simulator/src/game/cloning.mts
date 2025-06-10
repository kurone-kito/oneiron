import type { Player, Team } from '../types.mjs';

/** Clone a player with duplicated card array. */
export const clonePlayer = (p: Player): Player => ({
  ...p,
  cards: [...p.cards],
});

/** Deep clone a team including players and grid cards. */
export const cloneTeam = (t: Team): Team => ({
  ...t,
  players: t.players.map(clonePlayer),
  gridCards: [...t.gridCards],
});

/**
 * Deep clone an array of teams.
 *
 * @param teams - Teams to clone.
 * @returns New array with cloned team instances.
 */
export const cloneTeams = (teams: readonly Team[]): Team[] =>
  teams.map(cloneTeam);
