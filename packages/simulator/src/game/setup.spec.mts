import { describe, expect, it } from 'vitest';
import { createGrid, createTeams } from './setup.mjs';

describe('createGrid', () => {
  it('creates square grid with nulls', () => {
    const grid = createGrid(3);
    expect(grid.length).toBe(3);
    expect(grid[0]?.length).toBe(3);
    expect(grid.every((row) => row.every((cell) => cell === null))).toBe(true);
  });
});

describe('createTeams', () => {
  it('creates teams for given players', () => {
    const teams = createTeams(5, false);
    expect(teams.length).toBe(3);
    expect(teams[0]?.players.length).toBe(2);
    expect(teams[2]?.players.length).toBe(1);
  });
});
