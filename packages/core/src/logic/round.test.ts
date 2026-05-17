import { describe, expect, it } from 'vitest';
import type { ElementCard } from '../types/card.ts';
import type { Facing, GridCoord, TeamState } from '../types/grid.ts';
import type { LifeToken, NumberToken } from '../types/token.ts';
import type { RoundState } from './round.ts';
import {
  advanceBattle,
  advanceForbidden,
  advanceMovement,
  advanceRevival,
  createEmptyGrid,
  isGameOver,
  winner,
} from './round.ts';

function makeTeam(
  id: NumberToken,
  pos: GridCoord,
  facing: Facing = 'north',
  life: LifeToken = 2,
): TeamState {
  return {
    teamNumber: id,
    position: pos,
    facing,
    cards: [],
    players: [{ life }],
  };
}

function stateWith(teams: TeamState[]): RoundState {
  let grid = createEmptyGrid();
  for (const team of teams) {
    const { x, y } = team.position;
    const cell = [...grid[x][y], team];
    grid = { ...grid, [x]: { ...grid[x], [y]: cell } } as typeof grid;
  }
  return { phase: 'battle', round: 1, grid, forbiddenCells: [] };
}

const fireWater: GridCoord = { x: 'fire', y: 'water' };
const waterWater: GridCoord = { x: 'water', y: 'water' };
const woodWater: GridCoord = { x: 'wood', y: 'water' };
const fireWood: GridCoord = { x: 'fire', y: 'wood' };
const fireFire: GridCoord = { x: 'fire', y: 'fire' };

describe('createEmptyGrid', () => {
  it('returns a 3×3 grid with no teams', () => {
    const g = createEmptyGrid();
    expect(g.fire.fire).toEqual([]);
    expect(g.water.wood).toEqual([]);
    expect(g.wood.water).toEqual([]);
  });
});

describe('isGameOver', () => {
  it('returns true when no teams are alive', () => {
    expect(isGameOver(stateWith([]))).toBe(true);
  });
  it('returns true when exactly one team is alive', () => {
    const s = stateWith([makeTeam(1 as NumberToken, fireWater)]);
    expect(isGameOver(s)).toBe(true);
  });
  it('returns false when two or more teams are alive', () => {
    const s = stateWith([
      makeTeam(1 as NumberToken, fireWater),
      makeTeam(2 as NumberToken, waterWater),
    ]);
    expect(isGameOver(s)).toBe(false);
  });
  it('treats teams with zero life as dead', () => {
    const s = stateWith([
      makeTeam(1 as NumberToken, fireWater, 'north', 0 as LifeToken),
      makeTeam(2 as NumberToken, waterWater),
    ]);
    expect(isGameOver(s)).toBe(true);
  });
});

describe('winner', () => {
  it('returns null when no teams survive', () => {
    expect(winner(stateWith([]))).toBeNull();
  });
  it('returns the surviving team id', () => {
    const s = stateWith([makeTeam(3 as NumberToken, fireWater)]);
    expect(winner(s)).toBe(3);
  });
  it('returns null when two teams survive (no winner yet)', () => {
    const s = stateWith([
      makeTeam(1 as NumberToken, fireWater),
      makeTeam(2 as NumberToken, waterWater),
    ]);
    expect(winner(s)).toBeNull();
  });
});

describe('advanceBattle', () => {
  it('returns empty when no teams are on the grid', () => {
    expect(advanceBattle(stateWith([]))).toEqual([]);
  });
  it('identifies same-cell encounters', () => {
    const s = stateWith([
      makeTeam(1 as NumberToken, fireWater),
      makeTeam(2 as NumberToken, fireWater),
    ]);
    const results = advanceBattle(s);
    expect(results).toHaveLength(1);
    expect(results[0]?.encounterType).toBe('same-cell');
  });
  it('identifies adjacent encounters', () => {
    const s = stateWith([
      makeTeam(1 as NumberToken, fireWater),
      makeTeam(2 as NumberToken, waterWater),
    ]);
    const results = advanceBattle(s);
    expect(results).toHaveLength(1);
    expect(results[0]?.encounterType).toBe('adjacent');
  });
  it('does not list non-adjacent, non-same teams', () => {
    const s = stateWith([
      makeTeam(1 as NumberToken, fireFire),
      makeTeam(2 as NumberToken, woodWater),
    ]);
    expect(advanceBattle(s)).toEqual([]);
  });
});

describe('advanceForbidden', () => {
  it('advances phase to movement', () => {
    const s = stateWith([]);
    const fire5: ElementCard = { kind: 'element', element: 'fire', value: 5 };
    const water3: ElementCard = { kind: 'element', element: 'water', value: 3 };
    const next = advanceForbidden(s, [fire5, water3]);
    expect(next.phase).toBe('movement');
  });
  it('adds the new forbidden cell based on card elements', () => {
    const s = stateWith([]);
    const fire5: ElementCard = { kind: 'element', element: 'fire', value: 5 };
    const water3: ElementCard = { kind: 'element', element: 'water', value: 3 };
    const next = advanceForbidden(s, [fire5, water3]);
    expect(next.forbiddenCells).toContainEqual({ x: 'fire', y: 'water' });
  });
  it('accumulates multiple forbidden cells', () => {
    const s = stateWith([]);
    const c1: ElementCard = { kind: 'element', element: 'fire', value: 1 };
    const c2: ElementCard = { kind: 'element', element: 'water', value: 1 };
    const c3: ElementCard = { kind: 'element', element: 'wood', value: 1 };
    const s2 = advanceForbidden(s, [c1, c2]);
    const s3 = advanceForbidden({ ...s2, phase: 'battle' }, [c2, c3]);
    expect(s3.forbiddenCells).toHaveLength(2);
  });
});

describe('advanceMovement', () => {
  it('advances phase to revival', () => {
    const s = stateWith([makeTeam(1 as NumberToken, fireWater)]);
    const next = advanceMovement(s, 'fire', []);
    expect(next.phase).toBe('revival');
  });
  it('moves team forward when card matches attribute', () => {
    const team = makeTeam(1 as NumberToken, fireWater, 'east');
    const s = stateWith([team]);
    const card = {
      kind: 'element' as const,
      element: 'fire' as const,
      value: 5 as const,
    };
    const next = advanceMovement(s, 'fire', [
      { teamId: 1 as NumberToken, card, intendedFacing: 'east' },
    ]);
    const moved = next.grid['water']['water'];
    expect(moved).toHaveLength(1);
  });
  it('rotates facing when card does not match attribute', () => {
    const team = makeTeam(1 as NumberToken, fireWater, 'north');
    const s = stateWith([team]);
    const card = {
      kind: 'element' as const,
      element: 'water' as const,
      value: 3 as const,
    };
    const next = advanceMovement(s, 'fire', [
      { teamId: 1 as NumberToken, card, intendedFacing: 'south' },
    ]);
    const rotated = next.grid['fire']['water'];
    expect(rotated[0]?.facing).toBe('south');
  });
  it('stays at grid edge when moving north from wood row', () => {
    const team = makeTeam(1 as NumberToken, fireWood, 'north');
    const s = stateWith([team]);
    const card = {
      kind: 'element' as const,
      element: 'fire' as const,
      value: 1 as const,
    };
    const next = advanceMovement(s, 'fire', [
      { teamId: 1 as NumberToken, card, intendedFacing: 'north' },
    ]);
    const cell = next.grid['fire']['wood'];
    expect(cell).toHaveLength(1);
  });
});

describe('advanceRevival', () => {
  it('advances phase to battle', () => {
    const s = stateWith([]);
    const next = advanceRevival({ ...s, phase: 'revival' });
    expect(next.phase).toBe('battle');
  });
  it('increments round number', () => {
    const s = stateWith([]);
    const next = advanceRevival({ ...s, phase: 'revival' });
    expect(next.round).toBe(s.round + 1);
  });
});
