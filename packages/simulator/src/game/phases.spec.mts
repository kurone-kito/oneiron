import { describe, expect, it, vi } from 'vitest';
import { ATTRIBUTES, CARD_DUPLICATION, GRID_SIZE } from '../constants.mjs';
import type { GameState, Team } from '../types.mjs';
import {
  handleBattlePhase,
  handleRound0Descent,
  handleRound0Prep,
  initializeGame,
  nextPhase,
  phaseHandlers,
} from './phases.mjs';

const baseState: GameState = {
  phase: 'setup',
  round: 0,
  teams: [],
  grid: Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null)),
  forbiddenAreas: [],
  currentPlayerCount: 5,
  isAutoMode: false,
  isPlaying: true,
};

const rng = () => 0.5;

describe('initializeGame', () => {
  it('creates teams based on player count', () => {
    const { state, deck, logs } = initializeGame(baseState, rng);
    expect(state.phase).toBe('round0-prep');
    expect(state.teams.length).toBe(3);
    const expectedSize = ATTRIBUTES.length * 13 * CARD_DUPLICATION + 2;
    expect(deck.length).toBe(expectedSize);
    expect(logs.length).toBe(2);
  });
});

describe('handleRound0Prep', () => {
  it('distributes cards evenly to players', () => {
    const init = initializeGame(baseState, () => 0);
    const result = handleRound0Prep(init.state, init.deck, () => 0);
    const p0 = result.state.teams[0]?.players[0]?.cards.length ?? 0;
    const p1 = result.state.teams[0]?.players[1]?.cards.length ?? 0;
    expect(Math.abs(p0 - p1)).toBeLessThanOrEqual(1);
    expect(p0 + p1).toBeGreaterThanOrEqual(5);
    expect(result.state.phase).toBe('round0-descent');
  });
});

describe('handleRound0Descent', () => {
  it('places teams on the grid', () => {
    const init = initializeGame(baseState, () => 0);
    const prep = handleRound0Prep(init.state, init.deck, () => 0);
    const result = handleRound0Descent(prep.state, prep.deck, () => 0);
    expect(result.state.phase).toBe('battle');
    expect(result.state.round).toBe(1);
    expect(result.state.teams[0]?.position).toEqual({ x: 1, y: 1 });
    expect(result.state.grid[1]?.[1]).not.toBeNull();
  });
});

describe('nextPhase', () => {
  it('advances phases sequentially', () => {
    let result = initializeGame(baseState, rng);
    result = nextPhase(result.state, result.deck, () => {}, rng);
    expect(result.state.phase).toBe('round0-descent');
    result = nextPhase(result.state, result.deck, () => {}, rng);
    expect(result.state.phase).toBe('battle');
    expect(result.state.round).toBe(1);
    result = nextPhase(result.state, result.deck, () => {});
    // after battle phase without elimination -> forbidden
    expect(
      result.state.phase === 'forbidden' || result.state.phase === 'finished',
    ).toBe(true);
  });
});

describe('phaseHandlers', () => {
  it('matches nextPhase results for each phase', () => {
    const phases = Object.keys(phaseHandlers) as Array<
      keyof typeof phaseHandlers
    >;
    let { state, deck } = initializeGame(baseState, rng);
    for (const phase of phases) {
      state = { ...state, phase } as GameState;
      const fromNext = nextPhase(state, deck, () => {}, rng);
      const fromMap = phaseHandlers[phase](state, deck, () => {}, rng);
      expect(fromMap).toEqual(fromNext);
    }
  });
});

describe('handleBattlePhase', () => {
  const makeTeam = (
    id: number,
    pos: { x: number; y: number } = { x: 0, y: 0 },
  ): Team => ({
    id,
    players: [
      {
        id: `p${id}`,
        name: `P${id}`,
        isBot: false,
        life: 1,
        isAlive: true,
        cards: [
          {
            attribute: id === 1 ? ('fire' as const) : ('wood' as const),
            number: 1,
            type: 'attribute',
          },
        ],
      },
    ],
    position: pos,
    direction: 'north' as const,
    gridCards: [],
    isEliminated: false,
  });

  it('declares winner when only one team survives', () => {
    const state: GameState = {
      ...baseState,
      phase: 'battle',
      teams: [makeTeam(1, { x: 0, y: 0 }), makeTeam(2, { x: 1, y: 0 })],
    };
    const logs: string[] = [];
    const result = handleBattlePhase(state, [], (m) => logs.push(m));
    expect(result.state.phase).toBe('finished');
    expect(result.state.teams[1]?.isEliminated).toBe(true);
    expect(logs.some((l) => l.includes('チーム1の勝利'))).toBe(true);
  });

  it('moves to forbidden when no encounters', () => {
    const state: GameState = {
      ...baseState,
      phase: 'battle',
      teams: [makeTeam(1, { x: 0, y: 0 }), makeTeam(2, { x: 4, y: 4 })],
    };
    const logs: string[] = [];
    const result = handleBattlePhase(state, [], (m) => logs.push(m));
    expect(result.state.phase).toBe('forbidden');
    expect(logs).toContain('エンカウントは発生しませんでした');
  });

  it('uses injected helpers', () => {
    const state: GameState = { ...baseState, phase: 'battle', teams: [] };
    const pairs = vi.fn().mockReturnValue([]);
    const sim = vi.fn();
    handleBattlePhase(state, [], () => {}, { findPairs: pairs, simulate: sim });
    expect(pairs).toHaveBeenCalled();
    expect(sim).not.toHaveBeenCalled();
  });
});
