import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
import { createBoardCells } from '../../board.mjs';
import { GRID_SIZE } from '../../constants.mjs';
import type { CardType, Team } from '../../types.mjs';
import { GameBoard } from './GameBoard.js';

describe('GameBoard', () => {
  const grid: (CardType | null)[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null));
  const card = { attribute: 'fire', number: 1, type: 'attribute' } as const;
  (grid[1] as (CardType | null)[])[1] = card;
  const teams: Pick<
    Team,
    'id' | 'position' | 'direction' | 'isEliminated' | 'gridCards'
  >[] = [
    {
      id: 1,
      position: { x: 1, y: 1 },
      direction: 'east',
      isEliminated: false,
      gridCards: [],
    },
  ];

  it('renders grid cells', () => {
    const { getAllByTestId } = render(() => (
      <GameBoard grid={grid} teams={teams} />
    ));
    expect(getAllByTestId('grid-cell').length).toBe(GRID_SIZE ** 2);
  });

  it('maps teams into cell info', () => {
    const cells = createBoardCells(grid, teams);
    expect(cells[1]?.[1]?.team).toEqual({
      id: 1,
      direction: 'east',
      gridCards: [],
    });
  });
});
