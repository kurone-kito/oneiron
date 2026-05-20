import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../config.ts';
import type { Card, ElementCard, JokerCard } from '../types/card.ts';
import type { GridCoord, TeamState } from '../types/grid.ts';
import { ELEMENT_AXIS } from '../types/grid.ts';
import type { NumberToken, TeamId } from '../types/token.ts';
import { createLifeToken } from '../types/token.ts';
import type { BattlePlay } from './battle.ts';
import type { RevivalAction, RoundState, TeamMove } from './round.ts';
import { createEmptyGrid, isGameOver } from './round.ts';
import type { InputProvider, RoundInputs } from './runner.ts';
import { runRound, runUntilGameOver } from './runner.ts';
import { setupGame } from './setup.ts';

const fire1: ElementCard = { kind: 'element', element: 'fire', value: 1 };
const fire5: ElementCard = { kind: 'element', element: 'fire', value: 5 };
const water3: ElementCard = { kind: 'element', element: 'water', value: 3 };
const wood1: ElementCard = { kind: 'element', element: 'wood', value: 1 };
const wood4: ElementCard = { kind: 'element', element: 'wood', value: 4 };
const joker: JokerCard = { kind: 'joker' };

function allTeams(state: RoundState): TeamState[] {
  const teams: TeamState[] = [];
  for (const x of ELEMENT_AXIS) {
    for (const y of ELEMENT_AXIS) {
      teams.push(...state.grid[x][y]);
    }
  }
  return teams;
}

function stateWith(
  teams: readonly TeamState[],
  deck: readonly Card[] = [],
): RoundState {
  let grid = createEmptyGrid();
  for (const team of teams) {
    const { x, y } = team.position;
    grid = {
      ...grid,
      [x]: { ...grid[x], [y]: [...grid[x][y], team] },
    } as typeof grid;
  }
  return {
    phase: 'battle',
    round: 1,
    grid,
    forbiddenCells: [],
    deck: [...deck],
    graveyard: [],
  };
}

const fireWater: GridCoord = { x: 'fire', y: 'water' };
const waterWater: GridCoord = { x: 'water', y: 'water' };

function makeTeam(opts: {
  id: NumberToken;
  position: GridCoord;
  life?: number;
  members?: 1 | 2;
  gridCards?: readonly [Card, Card];
}): TeamState {
  const life = opts.life ?? 4;
  const members = opts.members ?? 1;
  const players =
    members === 1
      ? [{ life: createLifeToken(life) }]
      : [{ life: createLifeToken(life) }, { life: createLifeToken(life) }];
  return {
    teamNumber: opts.id,
    position: opts.position,
    facing: 'north',
    cards: [],
    players,
    ...(opts.gridCards ? { gridCards: opts.gridCards } : {}),
  };
}

/** Builds a deck with three (forbidden-x, forbidden-y, movement-attr) triples. */
function deckOfTriples(
  triples: readonly (readonly [Card, Card, Card])[],
): Card[] {
  const out: Card[] = [];
  for (const t of triples) {
    out.push(t[0], t[1], t[2]);
  }
  return out;
}

describe('runRound', () => {
  function makeInputs(
    opts: {
      plays?: readonly BattlePlay[];
      teamMoves?: readonly TeamMove[];
      revivalChoices?: ReadonlyMap<TeamId, RevivalAction>;
    } = {},
  ): RoundInputs {
    return {
      battle: { plays: opts.plays ?? [] },
      movement: { teamMoves: opts.teamMoves ?? [] },
      revival: { choices: opts.revivalChoices ?? new Map() },
    };
  }

  it('chains all four phases when game is not over', () => {
    const teamA = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      life: 4,
      gridCards: [fire5, water3],
    });
    const teamB = makeTeam({
      id: 2 as NumberToken,
      position: waterWater,
      life: 4,
      gridCards: [wood1, wood4],
    });
    const s = stateWith([teamA, teamB], deckOfTriples([[wood1, wood1, fire5]]));
    const out = runRound(s, makeInputs());
    // After full round, revival advances round to 2
    expect(out.state.round).toBe(2);
    expect(out.state.phase).toBe('battle');
  });

  it('produces a log entry per battle result', () => {
    const teamA = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      life: 4,
      gridCards: [fire5, water3],
    });
    const teamB = makeTeam({
      id: 2 as NumberToken,
      position: fireWater,
      life: 4,
      gridCards: [wood1, wood4],
    });
    const s = stateWith([teamA, teamB], deckOfTriples([[wood1, wood1, fire5]]));
    const out = runRound(
      s,
      makeInputs({
        plays: [
          { teamId: 1 as NumberToken, card: fire5 },
          { teamId: 2 as NumberToken, card: wood4 },
        ],
      }),
    );
    const battleLogs = out.log.filter((e) => e.phase === 'battle');
    expect(battleLogs).toHaveLength(1);
    expect(battleLogs[0]?.message).toContain('Team 1');
  });

  it('draws the forbidden coord from the top of state.deck', () => {
    const teamA = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      life: 4,
      gridCards: [fire5, water3],
    });
    const teamB = makeTeam({
      id: 2 as NumberToken,
      position: waterWater,
      life: 4,
      gridCards: [wood1, wood4],
    });
    const s = stateWith([teamA, teamB], [water3, fire5, fire5]);
    const out = runRound(s, makeInputs());
    const forbiddenLogs = out.log.filter((e) => e.phase === 'forbidden');
    expect(forbiddenLogs).toHaveLength(1);
    expect(forbiddenLogs[0]?.message).toContain('water');
    expect(forbiddenLogs[0]?.message).toContain('fire');
    expect(out.state.forbiddenCells).toContainEqual({ x: 'water', y: 'fire' });
  });

  it('consumes 3 cards per round from state.deck (2 forbidden + 1 movement)', () => {
    const teamA = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      life: 4,
      gridCards: [fire5, water3],
    });
    const teamB = makeTeam({
      id: 2 as NumberToken,
      position: waterWater,
      life: 4,
      gridCards: [wood1, wood4],
    });
    const deck = deckOfTriples([[wood1, wood1, fire5]]);
    const s = stateWith([teamA, teamB], deck);
    const out = runRound(s, makeInputs());
    expect(s.deck).toHaveLength(3);
    expect(out.state.deck).toHaveLength(0);
  });

  it('skips forbidden phase when deck has fewer than 2 cards', () => {
    const teamA = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      life: 4,
      gridCards: [fire5, water3],
    });
    const teamB = makeTeam({
      id: 2 as NumberToken,
      position: waterWater,
      life: 4,
      gridCards: [wood1, wood4],
    });
    const s = stateWith([teamA, teamB], [wood1]); // only 1 card
    const out = runRound(s, makeInputs());
    const forbiddenLogs = out.log.filter((e) => e.phase === 'forbidden');
    expect(forbiddenLogs).toHaveLength(1);
    expect(forbiddenLogs[0]?.message).toContain('exhausted');
    // No new forbidden cell added because phase skipped
    expect(out.state.forbiddenCells).toEqual([]);
  });

  it('skips movement phase when deck is empty after forbidden draw', () => {
    const teamA = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      life: 4,
      gridCards: [fire5, water3],
    });
    const teamB = makeTeam({
      id: 2 as NumberToken,
      position: waterWater,
      life: 4,
      gridCards: [wood1, wood4],
    });
    const s = stateWith([teamA, teamB], [wood1, wood1]); // forbidden draws both, none for movement
    const out = runRound(s, makeInputs());
    const movementLogs = out.log.filter((e) => e.phase === 'movement');
    expect(movementLogs.length).toBeGreaterThanOrEqual(1);
    expect(movementLogs.some((l) => l.message.includes('exhausted'))).toBe(
      true,
    );
  });

  it('treats a drawn Joker as the fire-element fallback for forbidden coord', () => {
    const teamA = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      life: 4,
      gridCards: [fire5, water3],
    });
    const teamB = makeTeam({
      id: 2 as NumberToken,
      position: waterWater,
      life: 4,
      gridCards: [wood1, wood4],
    });
    const s = stateWith([teamA, teamB], [joker, water3, fire5]);
    const out = runRound(s, makeInputs());
    expect(out.state.forbiddenCells).toContainEqual({
      x: 'fire',
      y: 'water',
    });
  });

  it('stops early when game ends mid-round (battle eliminates loser)', () => {
    const teamA = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      life: 4,
      gridCards: [fire5, water3],
    });
    const teamB = makeTeam({
      id: 2 as NumberToken,
      position: fireWater,
      life: 1,
      gridCards: [wood1, wood4],
    });
    const s = stateWith([teamA, teamB], deckOfTriples([[wood1, wood1, fire5]]));
    const out = runRound(
      s,
      makeInputs({
        plays: [
          { teamId: 1 as NumberToken, card: fire5 },
          { teamId: 2 as NumberToken, card: wood4 },
        ],
      }),
    );
    expect(isGameOver(out.state)).toBe(true);
    const forbiddenLogs = out.log.filter((e) => e.phase === 'forbidden');
    expect(forbiddenLogs).toHaveLength(0);
  });

  it('logs revival choices', () => {
    const teamA = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      life: 2,
      gridCards: [fire5, water3],
    });
    const teamB = makeTeam({
      id: 2 as NumberToken,
      position: waterWater,
      life: 4,
      gridCards: [wood1, wood4],
    });
    const baseState = stateWith(
      [teamA, teamB],
      deckOfTriples([[wood1, wood1, fire5]]),
    );
    const initialState: RoundState = {
      ...baseState,
      droppedLifeTokens: {
        fire: { fire: 0, water: 1, wood: 0 },
        water: { fire: 0, water: 0, wood: 0 },
        wood: { fire: 0, water: 0, wood: 0 },
      },
    };
    const choices = new Map<TeamId, RevivalAction>([
      [1 as NumberToken, { type: 'charge-life' }],
    ]);
    const out = runRound(initialState, makeInputs({ revivalChoices: choices }));
    const revivalLogs = out.log.filter((e) => e.phase === 'revival');
    expect(revivalLogs).toHaveLength(1);
    expect(revivalLogs[0]?.message).toContain('Team 1');
    expect(revivalLogs[0]?.message).toContain('charge-life');
  });
});

describe('runUntilGameOver', () => {
  it('terminates within maxRounds and returns winner', () => {
    const teamA = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      life: 4,
      gridCards: [fire5, water3],
    });
    const teamB = makeTeam({
      id: 2 as NumberToken,
      position: fireWater,
      life: 2,
      gridCards: [wood1, wood4],
    });
    // Plenty of deck for up to 10 rounds × 3 draws each.
    const deck = Array.from({ length: 30 }, (_, i) =>
      i % 3 === 2 ? fire5 : wood1,
    );
    const s = stateWith([teamA, teamB], deck);

    const provider: InputProvider = () => ({
      battle: {
        plays: [
          { teamId: 1 as NumberToken, card: joker },
          { teamId: 2 as NumberToken, card: wood4 },
        ],
      },
      movement: { teamMoves: [] },
      revival: { choices: new Map() },
    });

    const result = runUntilGameOver(s, provider, 10);
    expect(result.winner).toBe(1);
    expect(result.rounds).toBeLessThan(10);
    expect(isGameOver(result.state)).toBe(true);
  });

  it('caps at maxRounds when game does not end', () => {
    const teamA = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      life: 4,
      gridCards: [fire5, water3],
    });
    const teamB = makeTeam({
      id: 2 as NumberToken,
      position: waterWater,
      life: 4,
      gridCards: [wood1, wood4],
    });
    // Each round's forbidden draws both wood (so cell = wood,wood,
    // unoccupied) and movement attribute is wood (neither team's
    // movement card matches → only rotates, no position change).
    const deck = deckOfTriples(
      Array.from({ length: 6 }, () => [wood1, wood1, wood4] as const),
    );
    const s = stateWith([teamA, teamB], deck);
    const provider: InputProvider = () => ({
      battle: {
        plays: [
          { teamId: 1 as NumberToken, card: null },
          { teamId: 2 as NumberToken, card: null },
        ],
      },
      movement: { teamMoves: [] },
      revival: { choices: new Map() },
    });
    const result = runUntilGameOver(s, provider, 5);
    expect(result.rounds).toBe(5);
    expect(isGameOver(result.state)).toBe(false);
  });

  it('integrates with setupGame (deck populated by setup)', () => {
    const initial = setupGame({ playerCount: 4, seed: 7 }, DEFAULT_CONFIG);
    expect((initial.deck ?? []).length).toBeGreaterThan(0);
    const teamIds = allTeams(initial).map((t) => t.teamNumber);
    expect(teamIds.length).toBe(2);
    // Scripted: each team always plays a joker (always wins or draws)
    const provider: InputProvider = (state) => {
      const teams = allTeams(state);
      return {
        battle: {
          plays: teams.map((t) => ({
            teamId: t.teamNumber,
            card: joker as Card,
          })),
        },
        movement: {
          teamMoves: teams.map((t) => ({
            teamId: t.teamNumber,
            card: fire1 as Card,
            intendedFacing: t.facing,
          })),
        },
        revival: { choices: new Map() },
      };
    };
    const result = runUntilGameOver(initial, provider, 30);
    expect(result.rounds).toBeGreaterThan(0);
  });
});
