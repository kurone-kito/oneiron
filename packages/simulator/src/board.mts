import type { CardType, Team } from './types.mjs';
import { mapTeamsByPosition } from './utils/team.mjs';

/**
 * Information about a single cell on the game board.
 */
export interface BoardCellInfo {
  /** Card placed on the cell. */
  readonly card: CardType | null;
  /** Team occupying the cell, if any. */
  readonly team?: Readonly<Pick<Team, 'id' | 'direction' | 'gridCards'>>;
}

/**
 * Generate board cell information from the grid and teams.
 *
 * @param grid - Current game grid.
 * @param teams - Active teams including position and direction.
 * @returns Matrix of board cell info.
 */
export const createBoardCells = (
  grid: readonly (CardType | null)[][],
  teams: readonly Pick<
    Team,
    'id' | 'position' | 'direction' | 'isEliminated' | 'gridCards'
  >[],
): Readonly<BoardCellInfo[][]> => {
  const tm = mapTeamsByPosition(teams);
  return grid.map((row, y) =>
    row.map((cell, x) => {
      const team = tm.get(`${x}-${y}`);
      return team ? { card: cell, team } : { card: cell };
    }),
  );
};
