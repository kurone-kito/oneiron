import type { Player, Team } from '../types.mjs';

/**
 * Calculate how many teams are required for the given number of players.
 *
 * @param playerCount - Total participants.
 * @returns Number of teams to create.
 */
export const calculateTeamCount = (playerCount: number): number =>
  Math.ceil(playerCount / 2);

/**
 * Create a player instance.
 *
 * @param id - Sequential id number.
 * @param isHuman - Whether the player is controlled by a human.
 * @param isHumanable - Whether the player can be human-controlled.
 * @param playersInTeam - Total players in the team.
 * @returns New Player object.
 */
export const createPlayer = (
  id: number,
  isHuman: boolean,
  isHumanable: boolean,
  playersInTeam: number,
): Player => ({
  id: `player-${id}`,
  name: isHumanable ? 'あなた' : `BOT${id}`,
  isBot: !isHuman,
  life: playersInTeam === 1 ? 3 : 2,
  isAlive: true,
  cards: [],
});

/**
 * Assemble a team from players.
 *
 * @param id - Team id starting from 1.
 * @param players - Players belonging to the team.
 * @returns New Team object.
 */
export const createTeam = (id: number, players: Player[]): Team => ({
  id,
  players,
  position: { x: 0, y: 0 },
  direction: 'north',
  gridCards: [],
  isEliminated: false,
});
