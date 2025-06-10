import type { Team } from '../types.mjs';

/**
 * Count teams that are not eliminated.
 * @param teams - Team list.
 * @returns Number of alive teams.
 */
export const countAliveTeams = (teams: Pick<Team, 'isEliminated'>[]): number =>
  teams.filter((t) => !t.isEliminated).length;

/**
 * Map active team positions for quick lookup.
 * @param teams - Array of teams with their positions and directions.
 * @returns Map of team positions as keys and team id and direction as values.
 */
export const mapTeamsByPosition = (
  teams: readonly Pick<
    Team,
    'id' | 'position' | 'direction' | 'isEliminated' | 'gridCards'
  >[],
): ReadonlyMap<string, Pick<Team, 'id' | 'direction' | 'gridCards'>> =>
  new Map(
    teams
      .filter((t) => !t.isEliminated)
      .map(
        ({ id, position, direction, gridCards }) =>
          [
            `${position.x}-${position.y}`,
            { id, direction, gridCards },
          ] as const,
      ),
  );
