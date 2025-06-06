import { describe, expect, it } from 'vitest';
import { directions, phases } from '../constants/entities.mjs';
import type { Coordinate2D } from '../types/entities/board.mjs';
import type { GameState } from '../types/entities/game.mjs';
import type { Id } from '../types/entities/object.mjs';
import type { NumberToken } from '../types/entities/token.mjs';
import { createGameState, nextPhase } from './gameState.mjs';
import { createPlayer } from './player.mjs';
import { createTeam } from './team.mjs';

const coordinate = { x: 0, y: 0 } as const satisfies Coordinate2D;
const token = {
  id: 't1' as Id,
  type: 'number',
  value: 1,
} as const satisfies NumberToken;

describe('createGameState', () => {
  it('fills default state', () => {
    const team = createTeam([createPlayer()], token, coordinate, directions[0]);
    const state = createGameState([team]);
    expect(state.phase).toBe('battle');
    expect(state.round).toBe(1);
    expect(Array.from(state.forbids)).toEqual([]);
    expect(state.teams).toEqual([team]);
  });
});

describe('nextPhase', () => {
  it('cycles through phases', () => {
    const state = {
      forbids: new Set(),
      phase: phases[0],
      round: 1,
      teams: [],
    } as const satisfies GameState;
    expect(nextPhase(state).phase).toBe(phases[1]);
    expect(nextPhase({ ...state, phase: phases[3] }).phase).toBe(phases[0]);
  });
  it('returns original state when phase not found', () => {
    const original = {
      forbids: new Set(),
      phase: 'unknown',
      round: 1,
      teams: [],
    } as unknown as GameState;
    expect(nextPhase(original)).toBe(original);
  });
});
