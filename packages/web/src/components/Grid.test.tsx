import type { Grid, GridCoord, TeamState } from '@kurone-kito/oneiron-core';
import { createEmptyGrid } from '@kurone-kito/oneiron-core';
import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vitest';
import { GameGrid } from './Grid.tsx';

afterEach(cleanup);

const emptyGrid = createEmptyGrid();

function gridWithTeam(team: TeamState): Grid {
  const { x, y } = team.position;
  return {
    ...emptyGrid,
    [x]: { ...emptyGrid[x], [y]: [team] },
  } as Grid;
}

const team1: TeamState = {
  teamNumber: 1,
  position: { x: 'fire', y: 'water' },
  facing: 'north',
  cards: [],
  players: [{ life: 3 }, { life: 2 }],
};

describe('GameGrid', () => {
  it('renders a 3×3 grid with axis labels', () => {
    render(() => (
      <GameGrid grid={emptyGrid} forbiddenCells={[]} currentPhase="battle" />
    ));
    expect(screen.getAllByText('fire').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('water').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('wood').length).toBeGreaterThanOrEqual(1);
  });

  it('renders team position and facing arrow', () => {
    const g = gridWithTeam(team1);
    render(() => (
      <GameGrid grid={g} forbiddenCells={[]} currentPhase="battle" />
    ));
    expect(screen.getByLabelText('Team 1')).toBeTruthy();
    expect(screen.getByText('↑')).toBeTruthy();
  });

  it('marks forbidden cells with (forbidden) label', () => {
    const forbidden: GridCoord[] = [{ x: 'fire', y: 'water' }];
    render(() => (
      <GameGrid
        grid={emptyGrid}
        forbiddenCells={forbidden}
        currentPhase="forbidden"
      />
    ));
    expect(screen.getByLabelText('fire,water (forbidden)')).toBeTruthy();
  });

  it('renders without errors when grid is empty', () => {
    render(() => (
      <GameGrid grid={emptyGrid} forbiddenCells={[]} currentPhase="revival" />
    ));
    expect(screen.getByLabelText('Game grid — revival phase')).toBeTruthy();
  });
});
