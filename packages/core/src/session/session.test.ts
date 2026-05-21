import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../config.ts';
import {
  createEmptyDroppedTokens,
  createEmptyGrid,
  type DroppedTokens,
  isGameOver,
  type RoundState,
} from '../logic/round.ts';
import { setupGame } from '../logic/setup.ts';
import { randomStrategy } from '../strategy/random.ts';
import type { TeamStrategy } from '../strategy/strategy.ts';
import type { Card, ElementCard, JokerCard } from '../types/card.ts';
import type { GridCoord, TeamState } from '../types/grid.ts';
import { ELEMENT_AXIS } from '../types/grid.ts';
import {
  createLifeToken,
  type NumberToken,
  type TeamId,
} from '../types/token.ts';
import { createSession } from './session.ts';

const fire1: ElementCard = { kind: 'element', element: 'fire', value: 1 };
const fire5: ElementCard = { kind: 'element', element: 'fire', value: 5 };
const water1: ElementCard = { kind: 'element', element: 'water', value: 1 };
const water3: ElementCard = { kind: 'element', element: 'water', value: 3 };
const wood1: ElementCard = { kind: 'element', element: 'wood', value: 1 };
const wood4: ElementCard = { kind: 'element', element: 'wood', value: 4 };
const joker: JokerCard = { kind: 'joker' };

const fireFire: GridCoord = { x: 'fire', y: 'fire' };
const woodWood: GridCoord = { x: 'wood', y: 'wood' };

function stateWith(opts: {
  teams: readonly TeamState[];
  deck?: readonly Card[];
  droppedLifeTokens?: DroppedTokens;
  phase?: 'battle' | 'forbidden' | 'movement' | 'revival';
  forbiddenCells?: readonly GridCoord[];
}): RoundState {
  let grid = createEmptyGrid();
  for (const team of opts.teams) {
    const { x, y } = team.position;
    grid = {
      ...grid,
      [x]: { ...grid[x], [y]: [...grid[x][y], team] },
    } as typeof grid;
  }
  return {
    phase: opts.phase ?? 'battle',
    round: 1,
    grid,
    forbiddenCells: opts.forbiddenCells ?? [],
    deck: [...(opts.deck ?? [])],
    graveyard: [],
    droppedLifeTokens: opts.droppedLifeTokens ?? createEmptyDroppedTokens(),
  };
}

function makeTeam(opts: {
  id: NumberToken;
  position: GridCoord;
  facing?: 'north' | 'east' | 'south' | 'west';
  life?: number;
  cards?: readonly Card[];
  gridCards?: readonly [Card, Card];
}): TeamState {
  return {
    teamNumber: opts.id,
    position: opts.position,
    facing: opts.facing ?? 'north',
    cards: opts.cards ?? [],
    gridCards: opts.gridCards ?? [fire1, water1],
    players: [{ life: createLifeToken(opts.life ?? 4) }],
  };
}

function allTeams(state: RoundState): TeamState[] {
  const teams: TeamState[] = [];
  for (const x of ELEMENT_AXIS) {
    for (const y of ELEMENT_AXIS) {
      teams.push(...state.grid[x][y]);
    }
  }
  return teams;
}

function findTeam(state: RoundState, teamId: TeamId): TeamState | undefined {
  return allTeams(state).find((team) => team.teamNumber === teamId);
}

describe('createSession', () => {
  it('runs an all-bot round without awaiting human input', () => {
    const state = stateWith({
      teams: [
        makeTeam({
          id: 1 as NumberToken,
          position: fireFire,
          facing: 'east',
          cards: [fire5],
          gridCards: [wood1, water3],
        }),
        makeTeam({
          id: 2 as NumberToken,
          position: woodWood,
          cards: [wood1],
          gridCards: [fire1, wood4],
        }),
      ],
      deck: [water1, fire1, fire5, wood4, water3, joker],
    });
    const session = createSession(state, {
      controls: new Map<
        TeamId,
        {
          readonly type: 'bot';
          readonly strategy: ReturnType<typeof randomStrategy>;
        }
      >([
        [1 as NumberToken, { type: 'bot', strategy: randomStrategy(1) }],
        [2 as NumberToken, { type: 'bot', strategy: randomStrategy(2) }],
      ]),
    });

    const step = session.step();

    expect(step.status).toBe('done');
    expect(step.state.round).toBe(2);
    expect(step.state.phase).toBe('battle');
  });

  it('resolves empty-hand bot fallback movement without awaiting humans', () => {
    const fallbackStrategy: TeamStrategy = {
      chooseBattlePlay() {
        return { card: null };
      },
      chooseTeamMove(state, teamId) {
        const team = findTeam(state, teamId);
        if (team === undefined) {
          return null;
        }
        if (team.cards.length === 0) {
          return {
            kind: 'emergency-draw',
            intendedFacing: 'east',
            gridSwapIndex: 0,
            emergencyDrawPick: 1,
          };
        }
        return {
          kind: 'explicit',
          card: team.cards[0] as Card,
          intendedFacing: 'east',
          gridSwapIndex: 0,
        };
      },
      chooseRevivalAction() {
        return null;
      },
    };
    const state = stateWith({
      teams: [
        makeTeam({
          id: 1 as NumberToken,
          position: fireFire,
          cards: [],
          gridCards: [wood1, water3],
        }),
        makeTeam({
          id: 2 as NumberToken,
          position: woodWood,
          cards: [fire5],
          gridCards: [fire1, wood4],
        }),
      ],
      deck: [fire1, water1, water3, wood1, fire5],
    });
    const session = createSession(state, {
      controls: new Map([
        [
          1 as NumberToken,
          { type: 'bot' as const, strategy: fallbackStrategy },
        ],
        [
          2 as NumberToken,
          { type: 'bot' as const, strategy: fallbackStrategy },
        ],
      ]),
    });

    const step = session.step();

    expect(step.status).toBe('done');
    const team = findTeam(step.state, 1 as NumberToken);
    expect(team?.cards).toHaveLength(1);
    expect(team?.cards[0]).toEqual(wood1);
    expect(team?.gridCards?.[0]).toEqual(fire5);
  });

  it('preserves empty-hand movement fallback draw order across controls', () => {
    const fallbackStrategy: TeamStrategy = {
      chooseBattlePlay() {
        return { card: null };
      },
      chooseTeamMove() {
        return {
          kind: 'emergency-draw',
          intendedFacing: 'east',
          gridSwapIndex: 0,
          emergencyDrawPick: 0,
        };
      },
      chooseRevivalAction() {
        return null;
      },
    };
    const state = stateWith({
      teams: [
        makeTeam({
          id: 1 as NumberToken,
          position: fireFire,
          cards: [],
          gridCards: [wood1, water3],
        }),
        makeTeam({
          id: 2 as NumberToken,
          position: woodWood,
          cards: [],
          gridCards: [fire1, wood4],
        }),
      ],
      deck: [fire1, water1, water3, wood1, fire5, joker, wood4],
    });
    const session = createSession(state, {
      controls: new Map([
        [
          1 as NumberToken,
          { type: 'bot' as const, strategy: fallbackStrategy },
        ],
        [2 as NumberToken, { type: 'human' as const }],
      ]),
    });

    const battle = session.step();
    expect(battle).toMatchObject({
      status: 'awaiting',
      request: { phase: 'battle', humanTeams: [2] },
    });

    const movement = session.step({
      battlePlays: new Map([
        [2 as NumberToken, { teamId: 2 as NumberToken, card: null }],
      ]),
    });

    expect(movement).toMatchObject({
      status: 'awaiting',
      request: {
        phase: 'movement',
        humanTeams: [2],
        movementAttribute: 'water',
      },
    });
    const humanTeam = findTeam(movement.state, 2 as NumberToken);
    expect(humanTeam?.cards).toEqual([joker, wood4]);
  });

  it('awaits battle, movement, and revival for an all-human round', () => {
    const state = stateWith({
      teams: [
        makeTeam({
          id: 1 as NumberToken,
          position: fireFire,
          facing: 'east',
          cards: [fire5],
          gridCards: [wood1, water3],
        }),
        makeTeam({
          id: 2 as NumberToken,
          position: woodWood,
          cards: [wood1],
          gridCards: [fire1, wood4],
        }),
      ],
      deck: [water1, fire1, fire5, wood4, water3, joker],
    });
    const session = createSession(state, {
      controls: new Map([
        [1 as NumberToken, { type: 'human' as const }],
        [2 as NumberToken, { type: 'human' as const }],
      ]),
    });

    const battle = session.step();
    expect(battle).toMatchObject({
      status: 'awaiting',
      request: { phase: 'battle', humanTeams: [1, 2] },
    });

    const movement = session.step({
      battlePlays: new Map([
        [1 as NumberToken, { teamId: 1 as NumberToken, card: null }],
        [2 as NumberToken, { teamId: 2 as NumberToken, card: null }],
      ]),
    });
    expect(movement).toMatchObject({
      status: 'awaiting',
      request: {
        phase: 'movement',
        humanTeams: [1, 2],
        movementAttribute: 'fire',
      },
    });

    const revival = session.step({
      teamMoves: new Map([
        [
          1 as NumberToken,
          {
            teamId: 1 as NumberToken,
            card: fire5,
            intendedFacing: 'east',
          },
        ],
        [
          2 as NumberToken,
          {
            teamId: 2 as NumberToken,
            card: wood1,
            intendedFacing: 'north',
          },
        ],
      ]),
    });
    expect(revival).toMatchObject({
      status: 'awaiting',
      request: { phase: 'revival', humanTeams: [1] },
    });

    const done = session.step({
      revivalActions: new Map([
        [1 as NumberToken, { type: 'charge-cards' as const }],
      ]),
    });
    expect(done.status).toBe('done');
    expect(done.state.round).toBe(2);
    expect(done.state.phase).toBe('battle');
  });

  it('awaits only human-controlled teams in a mixed session', () => {
    const state = stateWith({
      teams: [
        makeTeam({
          id: 1 as NumberToken,
          position: fireFire,
          facing: 'east',
          cards: [fire5],
          gridCards: [wood1, water3],
        }),
        makeTeam({
          id: 2 as NumberToken,
          position: woodWood,
          cards: [wood1],
          gridCards: [fire1, wood4],
        }),
      ],
      deck: [water1, fire1, fire5, wood4, water3, joker],
    });
    const session = createSession(state, {
      controls: new Map([
        [1 as NumberToken, { type: 'human' as const }],
        [
          2 as NumberToken,
          { type: 'bot' as const, strategy: randomStrategy(2) },
        ],
      ]),
    });

    const battle = session.step();
    expect(battle).toMatchObject({
      status: 'awaiting',
      request: { phase: 'battle', humanTeams: [1] },
    });

    const movement = session.step({
      battlePlays: new Map([
        [1 as NumberToken, { teamId: 1 as NumberToken, card: null }],
      ]),
    });
    expect(movement).toMatchObject({
      status: 'awaiting',
      request: {
        phase: 'movement',
        humanTeams: [1],
        movementAttribute: 'fire',
      },
    });

    const revival = session.step({
      teamMoves: new Map([
        [
          1 as NumberToken,
          {
            teamId: 1 as NumberToken,
            card: fire5,
            intendedFacing: 'east',
          },
        ],
      ]),
    });
    expect(revival).toMatchObject({
      status: 'awaiting',
      request: { phase: 'revival', humanTeams: [1] },
    });
  });

  it('ignores revival inputs for bot-controlled teams', () => {
    const dropped = createEmptyDroppedTokens();
    const droppedLifeTokens: DroppedTokens = {
      ...dropped,
      fire: { ...dropped.fire, fire: 1 },
      wood: { ...dropped.wood, wood: 1 },
    };
    const state = stateWith({
      teams: [
        makeTeam({
          id: 1 as NumberToken,
          position: fireFire,
          life: 3,
          cards: [fire5],
        }),
        makeTeam({
          id: 2 as NumberToken,
          position: woodWood,
          life: 3,
          cards: [wood1],
        }),
      ],
      deck: [fire1, water1, water3],
      droppedLifeTokens,
      phase: 'revival',
    });
    const session = createSession(state, {
      controls: new Map([
        [1 as NumberToken, { type: 'human' as const }],
        [
          2 as NumberToken,
          {
            type: 'bot' as const,
            strategy: {
              chooseBattlePlay() {
                return { card: null };
              },
              chooseTeamMove() {
                return null;
              },
              chooseRevivalAction() {
                return null;
              },
            },
          },
        ],
      ]),
    });

    const revival = session.step();
    expect(revival).toMatchObject({
      status: 'awaiting',
      request: { phase: 'revival', humanTeams: [1] },
    });

    const done = session.step({
      revivalActions: new Map([
        [1 as NumberToken, { type: 'charge-cards' as const }],
        [2 as NumberToken, { type: 'charge-life' as const }],
      ]),
    });

    expect(done.status).toBe('done');
    const botTeam = findTeam(done.state, 2 as NumberToken);
    expect(botTeam?.players[0]?.life).toBe(3);
    expect(done.state.droppedLifeTokens?.wood.wood).toBe(1);
  });

  it('keeps awaiting revival until every human team submits an action', () => {
    const dropped = createEmptyDroppedTokens();
    const state = stateWith({
      teams: [
        makeTeam({
          id: 1 as NumberToken,
          position: fireFire,
          life: 3,
          cards: [fire5],
        }),
        makeTeam({
          id: 2 as NumberToken,
          position: woodWood,
          life: 3,
          cards: [wood1],
        }),
      ],
      deck: [fire1, water1, water3],
      droppedLifeTokens: {
        ...dropped,
        fire: { ...dropped.fire, fire: 1 },
      },
      phase: 'revival',
    });
    const session = createSession(state, {
      controls: new Map([
        [1 as NumberToken, { type: 'human' as const }],
        [2 as NumberToken, { type: 'human' as const }],
      ]),
    });

    const revival = session.step();
    expect(revival).toMatchObject({
      status: 'awaiting',
      request: { phase: 'revival', humanTeams: [1] },
    });

    const stillAwaiting = session.step({
      revivalActions: new Map(),
    });
    expect(stillAwaiting).toMatchObject({
      status: 'awaiting',
      request: { phase: 'revival', humanTeams: [1] },
    });

    const done = session.step({
      revivalActions: new Map([
        [1 as NumberToken, { type: 'charge-life' as const }],
      ]),
    });
    expect(done.status).toBe('done');
    expect(done.state.droppedLifeTokens?.fire.fire).toBe(0);
  });

  it('ignores explicit movement cards that are not in the team hand', () => {
    const state = stateWith({
      teams: [
        makeTeam({
          id: 1 as NumberToken,
          position: fireFire,
          cards: [water3],
          gridCards: [wood1, fire1],
        }),
        makeTeam({
          id: 2 as NumberToken,
          position: woodWood,
          cards: [wood4],
          gridCards: [fire5, wood1],
        }),
      ],
      deck: [water1, water1, fire1],
    });
    const session = createSession(state, {
      controls: new Map([
        [1 as NumberToken, { type: 'human' as const }],
        [
          2 as NumberToken,
          {
            type: 'bot' as const,
            strategy: {
              chooseBattlePlay() {
                return { card: null };
              },
              chooseTeamMove() {
                return null;
              },
              chooseRevivalAction() {
                return null;
              },
            },
          },
        ],
      ]),
    });

    expect(session.step()).toMatchObject({
      status: 'awaiting',
      request: { phase: 'battle', humanTeams: [1] },
    });

    const movement = session.step({
      battlePlays: new Map([
        [1 as NumberToken, { teamId: 1 as NumberToken, card: null }],
      ]),
    });
    expect(movement).toMatchObject({
      status: 'awaiting',
      request: {
        phase: 'movement',
        humanTeams: [1],
        movementAttribute: 'fire',
      },
    });

    const done = session.step({
      teamMoves: new Map([
        [
          1 as NumberToken,
          {
            teamId: 1 as NumberToken,
            card: fire5,
            intendedFacing: 'east',
          },
        ],
      ]),
    });

    expect(done.status).toBe('done');
    const humanTeam = findTeam(done.state, 1 as NumberToken);
    expect(humanTeam?.cards).toEqual([water3]);
    expect(humanTeam?.gridCards).toEqual([wood1, fire1]);
    expect(humanTeam?.facing).toBe('north');
  });

  it('keeps the battle phase when the game ends during battle resolution', () => {
    const decisiveStrategy: TeamStrategy = {
      chooseBattlePlay(state, teamId) {
        const team = findTeam(state, teamId);
        return { card: team?.cards[0] ?? null };
      },
      chooseTeamMove() {
        return null;
      },
      chooseRevivalAction() {
        return null;
      },
    };
    const state = stateWith({
      teams: [
        makeTeam({
          id: 1 as NumberToken,
          position: fireFire,
          life: 4,
          cards: [fire5],
          gridCards: [wood1, water3],
        }),
        makeTeam({
          id: 2 as NumberToken,
          position: fireFire,
          life: 1,
          cards: [wood1],
          gridCards: [fire1, wood4],
        }),
      ],
      deck: [water1, fire1, fire5],
    });
    const session = createSession(state, {
      controls: new Map([
        [
          1 as NumberToken,
          { type: 'bot' as const, strategy: decisiveStrategy },
        ],
        [
          2 as NumberToken,
          { type: 'bot' as const, strategy: decisiveStrategy },
        ],
      ]),
    });

    const done = session.step();

    expect(done.status).toBe('done');
    expect(isGameOver(done.state)).toBe(true);
    expect(done.state.phase).toBe('battle');
    expect(done.state.forbiddenCells).toEqual([]);
  });

  it('treats missing controls as human without throwing', () => {
    const state = stateWith({
      teams: [
        makeTeam({
          id: 1 as NumberToken,
          position: fireFire,
          cards: [fire5],
        }),
        makeTeam({
          id: 2 as NumberToken,
          position: woodWood,
          cards: [wood1],
        }),
      ],
      deck: [water1, fire1, fire5],
    });

    const session = createSession(state, { controls: new Map() });

    const step = session.step();

    expect(step).toMatchObject({
      status: 'awaiting',
      request: { phase: 'battle', humanTeams: [1, 2] },
    });
  });

  it('pre-draws movement fallback cards for human teams with empty hands', () => {
    const state = stateWith({
      teams: [
        makeTeam({
          id: 1 as NumberToken,
          position: fireFire,
          cards: [],
          gridCards: [wood1, water3],
        }),
        makeTeam({
          id: 2 as NumberToken,
          position: woodWood,
          cards: [wood1],
          gridCards: [fire1, wood4],
        }),
      ],
      deck: [water1, fire1, fire5, wood1, wood4],
    });
    const session = createSession(state, {
      controls: new Map([
        [1 as NumberToken, { type: 'human' as const }],
        [2 as NumberToken, { type: 'human' as const }],
      ]),
    });

    session.step();
    const movement = session.step({
      battlePlays: new Map([
        [1 as NumberToken, { teamId: 1 as NumberToken, card: null }],
        [2 as NumberToken, { teamId: 2 as NumberToken, card: null }],
      ]),
    });

    expect(movement).toMatchObject({
      status: 'awaiting',
      request: { phase: 'movement', humanTeams: [1, 2] },
    });
    const team = allTeams(movement.state).find(
      (entry) => entry.teamNumber === 1,
    );
    expect(team?.cards).toEqual([wood1, wood4]);
  });

  it('keeps returning done after the game is already over', () => {
    const state = stateWith({
      teams: [
        makeTeam({
          id: 1 as NumberToken,
          position: fireFire,
          life: 4,
          cards: [fire5],
        }),
      ],
    });
    const session = createSession(state, { controls: new Map() });

    const first = session.step();
    const second = session.step();

    expect(first).toEqual({ status: 'done', state: state });
    expect(second).toEqual({ status: 'done', state: state });
  });

  it('can drive a short multi-round all-bot smoke run to game over', () => {
    const initial = setupGame({ playerCount: 6, seed: 7 }, DEFAULT_CONFIG);
    const controls = new Map<
      TeamId,
      {
        readonly type: 'bot';
        readonly strategy: ReturnType<typeof randomStrategy>;
      }
    >();
    for (const team of allTeams(initial)) {
      controls.set(team.teamNumber, {
        type: 'bot',
        strategy: randomStrategy(team.teamNumber),
      });
    }
    const session = createSession(initial, { controls });

    for (let i = 0; i < 100 && !isGameOver(session.state); i++) {
      const step = session.step();
      expect(step.status).toBe('done');
    }

    expect(isGameOver(session.state)).toBe(true);
  });
});
