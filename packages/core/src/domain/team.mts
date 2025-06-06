import type { Coordinate2D, Direction } from '../types/entities/board.mjs';
import type { Id } from '../types/entities/object.mjs';
import type { Player, Team } from '../types/entities/player.mjs';
import type { NumberToken } from '../types/entities/token.mjs';
import { createId } from './object.mjs';

/**
 * Creates a new team.
 * @param members An array of players that are part of the team.
 * @param token The token associated with the team.
 * @param coordinate The initial coordinate of the team on the board.
 * @param direction The initial direction of the team.
 * @param id The unique identifier for the team, defaults to a newly
 * created ID.
 * @returns A new team object.
 */
export const createTeam = (
  members: readonly [Player, Player] | readonly [Player],
  token: NumberToken,
  coordinate: Coordinate2D,
  direction: Direction,
  id: Id = createId(),
): Team => ({ id, members, token, coordinate, direction });
