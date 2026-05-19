import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../config.ts';
import type { Card } from '../types/card.ts';
import { isJokerCard } from '../types/card.ts';
import type { TeamState } from '../types/grid.ts';
import { ELEMENT_AXIS } from '../types/grid.ts';
import type { RoundState } from './round.ts';
import { setupGame } from './setup.ts';

function allTeams(state: RoundState): TeamState[] {
  const teams: TeamState[] = [];
  for (const x of ELEMENT_AXIS) {
    for (const y of ELEMENT_AXIS) {
      teams.push(...state.grid[x][y]);
    }
  }
  return teams;
}

function teamLife(team: TeamState): number {
  return team.players.reduce((sum, p) => sum + p.life, 0);
}

describe('setupGame', () => {
  it('starts at phase=battle, round=1, no forbidden cells', () => {
    const state = setupGame({ playerCount: 4, seed: 1 }, DEFAULT_CONFIG);
    expect(state.phase).toBe('battle');
    expect(state.round).toBe(1);
    expect(state.forbiddenCells).toEqual([]);
  });

  it('creates 1 pair team for 2 players', () => {
    const state = setupGame({ playerCount: 2, seed: 1 }, DEFAULT_CONFIG);
    const teams = allTeams(state);
    expect(teams).toHaveLength(1);
    const team = teams[0] as TeamState;
    expect(team.players).toHaveLength(2);
    expect(teamLife(team)).toBe(4);
  });

  it('creates 3 pair teams for 6 players', () => {
    const state = setupGame({ playerCount: 6, seed: 1 }, DEFAULT_CONFIG);
    const teams = allTeams(state);
    expect(teams).toHaveLength(3);
    for (const team of teams) {
      expect(team.players).toHaveLength(2);
      expect(teamLife(team)).toBe(4);
    }
  });

  it('creates 4 pairs + 1 solo team for 9 players', () => {
    const state = setupGame({ playerCount: 9, seed: 1 }, DEFAULT_CONFIG);
    const teams = allTeams(state);
    expect(teams).toHaveLength(5);
    const solo = teams.find((t) => t.players.length === 1);
    const pairs = teams.filter((t) => t.players.length === 2);
    expect(pairs).toHaveLength(4);
    expect(solo).toBeDefined();
    expect(teamLife(solo as TeamState)).toBe(3);
  });

  it('solo team receives at least one Joker in its hand', () => {
    const state = setupGame({ playerCount: 9, seed: 1 }, DEFAULT_CONFIG);
    const solo = allTeams(state).find(
      (t) => t.players.length === 1,
    ) as TeamState;
    const allSoloCards: Card[] = [...solo.cards, ...(solo.gridCards ?? [])];
    const jokerCount = allSoloCards.filter(isJokerCard).length;
    expect(jokerCount).toBeGreaterThanOrEqual(1);
  });

  it('1 solo team for playerCount=1', () => {
    const state = setupGame({ playerCount: 1, seed: 1 }, DEFAULT_CONFIG);
    const teams = allTeams(state);
    expect(teams).toHaveLength(1);
    const team = teams[0] as TeamState;
    expect(team.players).toHaveLength(1);
    expect(teamLife(team)).toBe(3);
  });

  it('throws for non-positive integer playerCount', () => {
    expect(() =>
      setupGame({ playerCount: 0, seed: 1 }, DEFAULT_CONFIG),
    ).toThrow();
    expect(() =>
      setupGame({ playerCount: -1, seed: 1 }, DEFAULT_CONFIG),
    ).toThrow();
    expect(() =>
      setupGame({ playerCount: 1.5, seed: 1 }, DEFAULT_CONFIG),
    ).toThrow();
  });

  it('places teams on unique grid cells', () => {
    const state = setupGame({ playerCount: 6, seed: 7 }, DEFAULT_CONFIG);
    const teams = allTeams(state);
    const positions = teams.map((t) => `${t.position.x},${t.position.y}`);
    expect(new Set(positions).size).toBe(positions.length);
  });

  it('assigns gridCards (pair of 2) to every team', () => {
    const state = setupGame({ playerCount: 6, seed: 3 }, DEFAULT_CONFIG);
    const teams = allTeams(state);
    for (const team of teams) {
      expect(team.gridCards).toBeDefined();
      expect(team.gridCards).toHaveLength(2);
    }
  });

  it('is deterministic: same seed produces equal RoundState', () => {
    const a = setupGame({ playerCount: 6, seed: 42 }, DEFAULT_CONFIG);
    const b = setupGame({ playerCount: 6, seed: 42 }, DEFAULT_CONFIG);
    expect(a).toEqual(b);
  });

  it('different seeds produce different setups', () => {
    const a = setupGame({ playerCount: 6, seed: 1 }, DEFAULT_CONFIG);
    const b = setupGame({ playerCount: 6, seed: 2 }, DEFAULT_CONFIG);
    expect(a).not.toEqual(b);
  });

  it('hand has expected element cards (B per element) for pair teams', () => {
    const state = setupGame({ playerCount: 4, seed: 1 }, DEFAULT_CONFIG);
    const pair = allTeams(state).find(
      (t) => t.players.length === 2,
    ) as TeamState;
    const allCards: Card[] = [...pair.cards, ...(pair.gridCards ?? [])];
    const counts = { fire: 0, water: 0, wood: 0 };
    for (const card of allCards) {
      if (card.kind === 'element') counts[card.element] += 1;
    }
    // Each pair team gets B (deckExtractFactor) per element from setup
    // batch. randomCardsDealt face-down cards add to the mix.
    expect(counts.fire).toBeGreaterThanOrEqual(
      DEFAULT_CONFIG.deckExtractFactor,
    );
    expect(counts.water).toBeGreaterThanOrEqual(
      DEFAULT_CONFIG.deckExtractFactor,
    );
    expect(counts.wood).toBeGreaterThanOrEqual(
      DEFAULT_CONFIG.deckExtractFactor,
    );
  });

  it('throws when playerCount produces more teams than grid cells (>9)', () => {
    expect(() =>
      setupGame({ playerCount: 19, seed: 1 }, DEFAULT_CONFIG),
    ).toThrow();
  });
});
