import { describe, expect, it } from 'vitest';
import type { Card, ElementCard, JokerCard } from '../types/card.ts';
import type { Facing, Grid, GridCoord, TeamState } from '../types/grid.ts';
import type { NumberToken } from '../types/token.ts';
import { createLifeToken } from '../types/token.ts';
import type { BattlePlay } from './battle.ts';
import { orderEncounters, resolveBattlePhase } from './battle.ts';
import type { RoundState } from './round.ts';
import { createEmptyGrid } from './round.ts';

const fire5: ElementCard = { kind: 'element', element: 'fire', value: 5 };
const fire9: ElementCard = { kind: 'element', element: 'fire', value: 9 };
const fire13: ElementCard = { kind: 'element', element: 'fire', value: 13 };
const water3: ElementCard = { kind: 'element', element: 'water', value: 3 };
const water7: ElementCard = { kind: 'element', element: 'water', value: 7 };
const wood1: ElementCard = { kind: 'element', element: 'wood', value: 1 };
const wood4: ElementCard = { kind: 'element', element: 'wood', value: 4 };
const wood12: ElementCard = { kind: 'element', element: 'wood', value: 12 };
const joker: JokerCard = { kind: 'joker' };

function makeTeam(opts: {
  id: NumberToken;
  position: GridCoord;
  facing?: Facing;
  life?: number;
  members?: 1 | 2;
  gridCards?: readonly [Card, Card];
}): TeamState {
  const facing = opts.facing ?? 'north';
  const life = opts.life ?? 2;
  const members = opts.members ?? 2;
  const players =
    members === 1
      ? [{ life: createLifeToken(life) }]
      : [{ life: createLifeToken(life) }, { life: createLifeToken(life) }];
  return {
    teamNumber: opts.id,
    position: opts.position,
    facing,
    cards: [],
    players,
    ...(opts.gridCards ? { gridCards: opts.gridCards } : {}),
  };
}

function stateWith(teams: readonly TeamState[]): RoundState {
  let grid: Grid = createEmptyGrid();
  for (const team of teams) {
    const { x, y } = team.position;
    grid = {
      ...grid,
      [x]: { ...grid[x], [y]: [...grid[x][y], team] },
    } as Grid;
  }
  return { phase: 'battle', round: 1, grid, forbiddenCells: [] };
}

const fireWater: GridCoord = { x: 'fire', y: 'water' };
const waterWater: GridCoord = { x: 'water', y: 'water' };
const woodWater: GridCoord = { x: 'wood', y: 'water' };
const fireFire: GridCoord = { x: 'fire', y: 'fire' };
const _fireWood: GridCoord = { x: 'fire', y: 'wood' };

describe('orderEncounters', () => {
  it('returns no encounters when teams are far apart', () => {
    const s = stateWith([
      makeTeam({ id: 1 as NumberToken, position: fireFire }),
      makeTeam({ id: 2 as NumberToken, position: woodWater }),
    ]);
    expect(orderEncounters(s)).toEqual([]);
  });

  it('returns single same-cell encounter for 2 teams in same cell', () => {
    const s = stateWith([
      makeTeam({ id: 1 as NumberToken, position: fireWater }),
      makeTeam({ id: 2 as NumberToken, position: fireWater }),
    ]);
    const enc = orderEncounters(s);
    expect(enc).toHaveLength(1);
    expect(enc[0]?.encounterType).toBe('same-cell');
  });

  it('pairs the lowest pair-sums first in same-cell with 4 teams', () => {
    // Team A pair-sum = 5+3 = 8
    // Team B pair-sum = 9+12 = 21
    // Team C pair-sum = 1+4 = 5
    // Team D pair-sum = 7+1 = 8
    // Sorted ascending by pair-sum (teamNumber tiebreaker):
    //   C(5), A(8), D(8), B(21)
    // Pairs: (C, A) and (D, B)
    const s = stateWith([
      makeTeam({
        id: 1 as NumberToken,
        position: fireWater,
        gridCards: [fire5, water3],
      }),
      makeTeam({
        id: 2 as NumberToken,
        position: fireWater,
        gridCards: [fire9, wood12],
      }),
      makeTeam({
        id: 3 as NumberToken,
        position: fireWater,
        gridCards: [wood1, wood4],
      }),
      makeTeam({
        id: 4 as NumberToken,
        position: fireWater,
        gridCards: [water7, wood1],
      }),
    ]);
    const enc = orderEncounters(s);
    expect(enc).toHaveLength(2);
    const pairs = enc.map((e) => `${e.teamA}-${e.teamB}`).sort();
    expect(pairs).toContain('3-1');
    expect(pairs).toContain('4-2');
  });

  it('skips the odd team out when 3 teams share a cell', () => {
    // Team 1 pair-sum = 5+3 = 8
    // Team 2 pair-sum = 1+1 = 2 (lowest)
    // Team 3 pair-sum = 9+12 = 21
    // Sorted: T2(2), T1(8), T3(21)
    // Pair: (T2, T1), T3 skipped
    const s = stateWith([
      makeTeam({
        id: 1 as NumberToken,
        position: fireWater,
        gridCards: [fire5, water3],
      }),
      makeTeam({
        id: 2 as NumberToken,
        position: fireWater,
        gridCards: [wood1, wood1],
      }),
      makeTeam({
        id: 3 as NumberToken,
        position: fireWater,
        gridCards: [fire9, wood12],
      }),
    ]);
    const enc = orderEncounters(s);
    expect(enc).toHaveLength(1);
    expect(enc[0]?.teamA).toBe(2);
    expect(enc[0]?.teamB).toBe(1);
  });

  it('treats joker as pair value 25', () => {
    // Team 1 pair-sum = joker(25) + joker(25) = 50
    // Team 2 pair-sum = fire5 + water3 = 8 (lowest)
    // Pair: (T2 first, T1 second) → (T2, T1)
    const s = stateWith([
      makeTeam({
        id: 1 as NumberToken,
        position: fireWater,
        gridCards: [joker, joker],
      }),
      makeTeam({
        id: 2 as NumberToken,
        position: fireWater,
        gridCards: [fire5, water3],
      }),
    ]);
    const enc = orderEncounters(s);
    expect(enc).toHaveLength(1);
    expect(enc[0]?.teamA).toBe(2);
    expect(enc[0]?.teamB).toBe(1);
  });

  it('returns adjacent encounters when no same-cell encounter applies', () => {
    const s = stateWith([
      makeTeam({ id: 1 as NumberToken, position: fireWater }),
      makeTeam({ id: 2 as NumberToken, position: waterWater }),
    ]);
    const enc = orderEncounters(s);
    expect(enc).toHaveLength(1);
    expect(enc[0]?.encounterType).toBe('adjacent');
  });

  it('does not list adjacent encounter when teams already encountered same-cell', () => {
    // Team 1 and Team 2 same cell. Team 3 adjacent to both.
    // Team 1+2 encounter same-cell; Team 3 has no remaining partner.
    const s = stateWith([
      makeTeam({
        id: 1 as NumberToken,
        position: fireWater,
        gridCards: [fire5, water3],
      }),
      makeTeam({
        id: 2 as NumberToken,
        position: fireWater,
        gridCards: [wood1, wood4],
      }),
      makeTeam({
        id: 3 as NumberToken,
        position: waterWater,
        gridCards: [fire5, fire5],
      }),
    ]);
    const enc = orderEncounters(s);
    expect(enc).toHaveLength(1);
    expect(enc[0]?.encounterType).toBe('same-cell');
  });

  it('falls back to teamNumber order when gridCards undefined', () => {
    const s = stateWith([
      makeTeam({ id: 5 as NumberToken, position: fireWater }),
      makeTeam({ id: 2 as NumberToken, position: fireWater }),
    ]);
    const enc = orderEncounters(s);
    expect(enc).toHaveLength(1);
    // Team 2 (sum=4) before Team 5 (sum=10) in fallback ordering
    expect(enc[0]?.teamA).toBe(2);
    expect(enc[0]?.teamB).toBe(5);
  });
});

describe('resolveBattlePhase', () => {
  function play(teamId: NumberToken, card: Card | null): BattlePlay {
    return { teamId, card };
  }

  it('returns no results when no encounters', () => {
    const s = stateWith([
      makeTeam({ id: 1 as NumberToken, position: fireFire }),
      makeTeam({ id: 2 as NumberToken, position: woodWater }),
    ]);
    const out = resolveBattlePhase(s, []);
    expect(out.results).toEqual([]);
  });

  it('applies damage to loser via calcDamage', () => {
    // Same-cell, north vs south (parallel) → facing bonus +1
    // fire5 vs wood4 → fire wins by RPS; values 5 vs 4 → no value modifier
    // Damage = 1 base + 1 facing = 2
    const teamA = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      facing: 'north',
      life: 4,
      members: 1,
      gridCards: [fire5, water3],
    });
    const teamB = makeTeam({
      id: 2 as NumberToken,
      position: fireWater,
      facing: 'south',
      life: 4,
      members: 1,
      gridCards: [wood1, wood4],
    });
    const s = stateWith([teamA, teamB]);
    const out = resolveBattlePhase(s, [
      play(1 as NumberToken, fire5),
      play(2 as NumberToken, wood4),
    ]);
    expect(out.results).toHaveLength(1);
    expect(out.results[0]?.winner).toBe(1);
    expect(out.results[0]?.damage).toBe(2);
    // Loser at fireWater coord has 2 dropped tokens
    expect(out.state.droppedLifeTokens?.fire.water).toBe(2);
    // Team B life reduced from 4 to 2
    const newB = out.state.grid.fire.water.find((t) => t.teamNumber === 2);
    expect(newB?.players[0]?.life).toBe(2);
  });

  it('joker win → fixed damage 1', () => {
    const teamA = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      facing: 'north',
      life: 4,
      members: 1,
      gridCards: [joker, joker],
    });
    const teamB = makeTeam({
      id: 2 as NumberToken,
      position: fireWater,
      facing: 'south',
      life: 4,
      members: 1,
      gridCards: [fire5, water3],
    });
    const s = stateWith([teamA, teamB]);
    const out = resolveBattlePhase(s, [
      play(1 as NumberToken, joker),
      play(2 as NumberToken, fire5),
    ]);
    expect(out.results[0]?.winner).toBe(1);
    expect(out.results[0]?.damage).toBe(1);
  });

  it('both teams forfeit (null cards) → draw, no damage', () => {
    const teamA = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      life: 4,
      members: 1,
      gridCards: [fire5, water3],
    });
    const teamB = makeTeam({
      id: 2 as NumberToken,
      position: fireWater,
      life: 4,
      members: 1,
      gridCards: [wood1, wood4],
    });
    const s = stateWith([teamA, teamB]);
    const out = resolveBattlePhase(s, [
      play(1 as NumberToken, null),
      play(2 as NumberToken, null),
    ]);
    expect(out.results[0]?.winner).toBeNull();
    expect(out.results[0]?.damage).toBe(0);
  });

  it('card-holder beats card-absence with fixed damage 1', () => {
    const teamA = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      life: 4,
      members: 1,
      gridCards: [fire5, water3],
    });
    const teamB = makeTeam({
      id: 2 as NumberToken,
      position: fireWater,
      life: 4,
      members: 1,
      gridCards: [wood1, wood4],
    });
    const s = stateWith([teamA, teamB]);
    const out = resolveBattlePhase(s, [
      play(1 as NumberToken, fire5),
      play(2 as NumberToken, null),
    ]);
    expect(out.results[0]?.winner).toBe(1);
    expect(out.results[0]?.damage).toBe(1);
  });

  it('eliminates a team when all players reach life 0', () => {
    const loser = makeTeam({
      id: 2 as NumberToken,
      position: fireWater,
      life: 1,
      members: 1,
      gridCards: [wood1, wood4],
    });
    const winnerTeam = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      facing: 'north',
      life: 4,
      members: 1,
      gridCards: [fire5, water3],
    });
    const s = stateWith([winnerTeam, loser]);
    const out = resolveBattlePhase(s, [
      play(1 as NumberToken, fire5),
      play(2 as NumberToken, wood1),
    ]);
    expect(out.results[0]?.winner).toBe(1);
    // Loser had 1 life; damage ≥ 1 eliminates them.
    const losers = out.state.grid.fire.water.filter((t) => t.teamNumber === 2);
    expect(losers).toHaveLength(0);
    // Only 1 token actually dropped (loser's remaining life)
    expect(out.state.droppedLifeTokens?.fire.water).toBe(1);
  });

  it('draw (same element) does not change state', () => {
    const a = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      life: 4,
      members: 1,
      gridCards: [fire5, water3],
    });
    const b = makeTeam({
      id: 2 as NumberToken,
      position: fireWater,
      life: 4,
      members: 1,
      gridCards: [wood1, wood4],
    });
    const s = stateWith([a, b]);
    const out = resolveBattlePhase(s, [
      play(1 as NumberToken, fire5),
      play(2 as NumberToken, fire9),
    ]);
    expect(out.results[0]?.winner).toBeNull();
    expect(out.results[0]?.damage).toBe(0);
    expect(out.state.droppedLifeTokens?.fire.water).toBe(0);
  });

  it('damage to multi-player team hits lowest-life player first', () => {
    // 2-player team: lives [1, 4]. Damage 2 → player 0 to 0 first, then player 1 to 3.
    const teamA = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      facing: 'north',
      life: 4,
      members: 1,
      gridCards: [fire13, water3],
    });
    const teamB: TeamState = {
      teamNumber: 2 as NumberToken,
      position: fireWater,
      facing: 'south',
      cards: [],
      players: [{ life: createLifeToken(1) }, { life: createLifeToken(4) }],
      gridCards: [wood1, wood4],
    };
    const s = stateWith([teamA, teamB]);
    // fire13 vs wood1: fire wins. Damage = 1 base + 1 facing + 1 bonus = 3
    const out = resolveBattlePhase(s, [
      play(1 as NumberToken, fire13),
      play(2 as NumberToken, wood1),
    ]);
    expect(out.results[0]?.damage).toBe(3);
    const newB = out.state.grid.fire.water.find((t) => t.teamNumber === 2);
    // 3 damage hits: lowest=p0(1)→0, then lowest-alive=p1(4)→3, then→2
    expect(newB?.players[0]?.life).toBe(0);
    expect(newB?.players[1]?.life).toBe(2);
    expect(out.state.droppedLifeTokens?.fire.water).toBe(3);
  });

  it('subsequent encounters operate on updated state', () => {
    // 3 teams: 1 & 2 same-cell, 3 also same-cell
    // Sorted by pair-sum: assume team 1 lowest, then team 2, then team 3
    // Round 1 encounter: pairs (T1, T2)
    // T3 skipped this round
    const a = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      facing: 'north',
      life: 4,
      members: 1,
      gridCards: [wood1, wood1],
    });
    const b = makeTeam({
      id: 2 as NumberToken,
      position: fireWater,
      facing: 'south',
      life: 4,
      members: 1,
      gridCards: [fire5, water3],
    });
    const c = makeTeam({
      id: 3 as NumberToken,
      position: fireWater,
      facing: 'east',
      life: 4,
      members: 1,
      gridCards: [fire13, wood12],
    });
    const s = stateWith([a, b, c]);
    const out = resolveBattlePhase(s, [
      play(1 as NumberToken, wood1),
      play(2 as NumberToken, fire5),
      play(3 as NumberToken, fire5),
    ]);
    // Only 1 encounter pair this round
    expect(out.results).toHaveLength(1);
  });
});
