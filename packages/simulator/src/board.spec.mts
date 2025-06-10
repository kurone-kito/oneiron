import { describe, expect, it } from 'vitest';
import { createBoardCells } from './board.mjs';
import { GRID_SIZE } from './constants.mjs';
import type { CardType, Team } from './types.mjs';

const grid: (CardType | null)[][] = Array(GRID_SIZE)
  .fill(null)
  .map(() => Array(GRID_SIZE).fill(null));
(grid[0] as (CardType | null)[])[0] = {
  attribute: 'fire',
  number: 1,
  type: 'attribute',
};

const teams: Pick<
  Team,
  'id' | 'position' | 'direction' | 'isEliminated' | 'gridCards'
>[] = [
  {
    id: 1,
    direction: 'north',
    isEliminated: false,
    gridCards: [],
    position: { x: 0, y: 0 },
  },
];

describe('createBoardCells', () => {
  it('maps grid and teams into cell info matrix', () => {
    const cells = createBoardCells(grid, teams);
    expect(cells[0]?.[0]).toEqual({
      card: { attribute: 'fire', number: 1, type: 'attribute' },
      team: { id: 1, direction: 'north', gridCards: [] },
    });
  });
});
