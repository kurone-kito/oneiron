import { describe, expect, it } from 'vitest';
import type { Team } from '../types.mts';
import { countAliveTeams, mapTeamsByPosition } from './team.mjs';

describe('countAliveTeams', () => {
  it('counts teams that are not eliminated', () => {
    const teams: Pick<Team, 'id' | 'isEliminated'>[] = [
      { id: 1, isEliminated: false },
      { id: 2, isEliminated: true },
      { id: 3, isEliminated: false },
    ];
    expect(countAliveTeams(teams)).toBe(2);
  });
});

describe('mapTeamsByPosition', () => {
  it('creates a map keyed by position for active teams', () => {
    const teams: Pick<
      Team,
      'id' | 'position' | 'direction' | 'isEliminated' | 'gridCards'
    >[] = [
      {
        id: 1,
        position: { x: 0, y: 0 },
        direction: 'north',
        isEliminated: false,
        gridCards: [],
      },
      {
        id: 2,
        position: { x: 1, y: 1 },
        direction: 'east',
        isEliminated: true,
        gridCards: [],
      },
      {
        id: 3,
        position: { x: 2, y: 2 },
        direction: 'south',
        isEliminated: false,
        gridCards: [],
      },
    ];
    const map = mapTeamsByPosition(teams);
    expect(map.get('0-0')).toEqual({
      id: 1,
      direction: 'north',
      gridCards: [],
    });
    expect(map.get('1-1')).toBeUndefined();
    expect(map.get('2-2')).toEqual({
      id: 3,
      direction: 'south',
      gridCards: [],
    });
  });
});
