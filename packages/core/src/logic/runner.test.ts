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

const fire5: ElementCard = { kind: 'element', element: 'fire', value: 5 };
const water3: ElementCard = { kind: 'element', element: 'water', value: 3 };
const wood4: ElementCard = { kind: 'element', element: 'wood', value: 4 };
const wood1: ElementCard = { kind: 'element', element: 'wood', value: 1 };
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

function stateWith(teams: readonly TeamState[]): RoundState {
  let grid = createEmptyGrid();
  for (const team of teams) {
    const { x, y } = team.position;
    grid = {
      ...grid,
      [x]: { ...grid[x], [y]: [...grid[x][y], team] },
    } as typeof grid;
  }
  return { phase: 'battle', round: 1, grid, forbiddenCells: [] };
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

describe('runRound', () => {
  function makeInputs(
    opts: {
      plays?: readonly BattlePlay[];
      forbidden?: readonly [ElementCard, ElementCard];
      movementAttribute?: 'fire' | 'water' | 'wood';
      teamMoves?: readonly TeamMove[];
      revivalChoices?: ReadonlyMap<TeamId, RevivalAction>;
    } = {},
  ): RoundInputs {
    return {
      battle: { plays: opts.plays ?? [] },
      forbidden: { drawnCards: opts.forbidden ?? [fire5, water3] },
      movement: {
        attribute: opts.movementAttribute ?? 'fire',
        teamMoves: opts.teamMoves ?? [],
      },
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
    const s = stateWith([teamA, teamB]);
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
    const s = stateWith([teamA, teamB]);
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

  it('logs the new forbidden cell', () => {
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
    const s = stateWith([teamA, teamB]);
    const out = runRound(s, makeInputs({ forbidden: [water3, fire5] }));
    const forbiddenLogs = out.log.filter((e) => e.phase === 'forbidden');
    expect(forbiddenLogs).toHaveLength(1);
    expect(forbiddenLogs[0]?.message).toContain('water');
    expect(forbiddenLogs[0]?.message).toContain('fire');
  });

  it('stops early when game ends mid-round (battle eliminates loser)', () => {
    // Team A: full life. Team B: 1 life. Battle damage will eliminate B.
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
    const s = stateWith([teamA, teamB]);
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
    // Forbidden / movement / revival should NOT have run
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
    const initialState: RoundState = {
      ...stateWith([teamA, teamB]),
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
    // 2-team setup, scripted provider: team 1 always wins via joker
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
    const s = stateWith([teamA, teamB]);

    const provider: InputProvider = () => ({
      battle: {
        plays: [
          { teamId: 1 as NumberToken, card: joker },
          { teamId: 2 as NumberToken, card: wood4 },
        ],
      },
      forbidden: { drawnCards: [fire5, water3] },
      movement: { attribute: 'fire', teamMoves: [] },
      revival: { choices: new Map() },
    });

    const result = runUntilGameOver(s, provider, 10);
    expect(result.winner).toBe(1);
    expect(result.rounds).toBeLessThan(10);
    expect(isGameOver(result.state)).toBe(true);
  });

  it('caps at maxRounds when game does not end', () => {
    // 2 teams that draw every round → never ends.
    // Forbidden cell points at an unoccupied coordinate to avoid
    // the movement-phase penalty eliminating teams over time.
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
    const s = stateWith([teamA, teamB]);
    const woodPin: ElementCard = { kind: 'element', element: 'wood', value: 1 };
    const provider: InputProvider = () => ({
      battle: {
        plays: [
          { teamId: 1 as NumberToken, card: null },
          { teamId: 2 as NumberToken, card: null },
        ],
      },
      // Forbidden cell at (wood, wood) — neither team occupies it.
      forbidden: { drawnCards: [woodPin, woodPin] },
      movement: { attribute: 'fire', teamMoves: [] },
      revival: { choices: new Map() },
    });
    const result = runUntilGameOver(s, provider, 5);
    expect(result.rounds).toBe(5);
    expect(isGameOver(result.state)).toBe(false);
  });

  it('integrates with setupGame', () => {
    const initial = setupGame({ playerCount: 4, seed: 7 }, DEFAULT_CONFIG);
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
        forbidden: { drawnCards: [fire5, water3] },
        movement: {
          attribute: 'fire',
          teamMoves: teams.map((t) => ({
            teamId: t.teamNumber,
            card: fire5 as Card,
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
