import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../config.ts';
import type { BattlePlay } from '../logic/battle.ts';
import { resolveBattlePhase } from '../logic/battle.ts';
import type { RevivalAction, RoundState } from '../logic/round.ts';
import {
  createEmptyDroppedTokens,
  createEmptyGrid,
  isGameOver,
} from '../logic/round.ts';
import type { InputProvider, MovementChoice } from '../logic/runner.ts';
import { runUntilGameOver } from '../logic/runner.ts';
import { setupGame } from '../logic/setup.ts';
import type { Card, ElementCard, JokerCard } from '../types/card.ts';
import { ELEMENT_AXIS, type GridCoord, type TeamState } from '../types/grid.ts';
import { createLifeToken, type NumberToken } from '../types/token.ts';
import { randomStrategy } from './random.ts';

const fire5: ElementCard = { kind: 'element', element: 'fire', value: 5 };
const water3: ElementCard = { kind: 'element', element: 'water', value: 3 };
const wood1: ElementCard = { kind: 'element', element: 'wood', value: 1 };
const wood4: ElementCard = { kind: 'element', element: 'wood', value: 4 };
const joker: JokerCard = { kind: 'joker' };
const fireWater: GridCoord = { x: 'fire', y: 'water' };

function makeTeam(opts: {
  id: NumberToken;
  position: GridCoord;
  life?: number;
  members?: 1 | 2;
  cards?: readonly Card[];
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
    cards: opts.cards ?? [],
    players,
    ...(opts.gridCards ? { gridCards: opts.gridCards } : {}),
  };
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

function allTeams(state: RoundState): TeamState[] {
  const teams: TeamState[] = [];
  for (const x of ELEMENT_AXIS) {
    for (const y of ELEMENT_AXIS) {
      teams.push(...state.grid[x][y]);
    }
  }
  return teams;
}

function makeBotProvider(
  strategies: ReadonlyMap<NumberToken, ReturnType<typeof randomStrategy>>,
): InputProvider {
  return (state) => {
    const plays: BattlePlay[] = [];
    for (const team of allTeams(state)) {
      const strategy = strategies.get(team.teamNumber);
      if (strategy === undefined) continue;
      const battle = strategy.chooseBattlePlay(state, team.teamNumber);
      plays.push({ teamId: team.teamNumber, card: battle.card });
    }

    const afterBattle = resolveBattlePhase(state, plays).state;
    const teamMoves: MovementChoice[] = [];
    const revivalChoices = new Map<NumberToken, RevivalAction>();

    for (const team of allTeams(afterBattle)) {
      const strategy = strategies.get(team.teamNumber);
      if (strategy === undefined) continue;

      const movement = strategy.chooseTeamMove(afterBattle, team.teamNumber);
      if (movement !== null) {
        teamMoves.push({ teamId: team.teamNumber, ...movement });
      }

      const revival = strategy.chooseRevivalAction(
        afterBattle,
        team.teamNumber,
      );
      if (revival !== null) {
        revivalChoices.set(team.teamNumber, revival);
      }
    }

    return {
      battle: { plays },
      movement: { teamMoves },
      revival: { choices: revivalChoices },
    };
  };
}

describe('randomStrategy', () => {
  it('is deterministic with the same seed and call order', () => {
    const team = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      cards: [fire5, water3, wood1],
      gridCards: [fire5, water3],
    });
    const state = stateWith([team]);
    const left = randomStrategy(42);
    const right = randomStrategy(42);

    expect(left.chooseBattlePlay(state, 1 as NumberToken)).toEqual(
      right.chooseBattlePlay(state, 1 as NumberToken),
    );
    expect(left.chooseTeamMove(state, 1 as NumberToken)).toEqual(
      right.chooseTeamMove(state, 1 as NumberToken),
    );
    expect(left.chooseRevivalAction(state, 1 as NumberToken)).toEqual(
      right.chooseRevivalAction(state, 1 as NumberToken),
    );
  });

  it('chooses only cards that are actually in the team hand for battle and explicit movement', () => {
    const team = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      cards: [fire5, water3, wood1, joker],
      gridCards: [fire5, water3],
    });
    const state = stateWith([team]);

    for (let seed = 1; seed <= 32; seed += 1) {
      const strategy = randomStrategy(seed);
      const battle = strategy.chooseBattlePlay(state, 1 as NumberToken);
      if (battle.card !== null) {
        expect(team.cards).toContainEqual(battle.card);
      }

      const movement = strategy.chooseTeamMove(state, 1 as NumberToken);
      expect(movement).not.toBeNull();
      if (movement?.kind === 'explicit') {
        expect(team.cards).toContainEqual(movement.card);
      }
    }
  });

  it('uses the emergency-draw movement path when the team hand is empty', () => {
    const team = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      cards: [],
      gridCards: [fire5, water3],
    });
    const state = stateWith([team], [wood1, wood4]);
    const strategy = randomStrategy(7);

    expect(strategy.chooseBattlePlay(state, 1 as NumberToken)).toEqual({
      card: null,
    });
    expect(strategy.chooseTeamMove(state, 1 as NumberToken)).toMatchObject({
      kind: 'emergency-draw',
    });
  });

  it('handles dead teams and missing team ids without throwing', () => {
    const deadTeam = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      life: 0,
      cards: [fire5],
      gridCards: [fire5, water3],
    });
    const state = stateWith([deadTeam]);
    const strategy = randomStrategy(9);

    expect(strategy.chooseBattlePlay(state, 1 as NumberToken)).toEqual({
      card: null,
    });
    expect(strategy.chooseTeamMove(state, 1 as NumberToken)).toBeNull();
    expect(strategy.chooseRevivalAction(state, 1 as NumberToken)).toBeNull();
    expect(strategy.chooseBattlePlay(state, 2 as NumberToken)).toEqual({
      card: null,
    });
    expect(strategy.chooseTeamMove(state, 2 as NumberToken)).toBeNull();
    expect(strategy.chooseRevivalAction(state, 2 as NumberToken)).toBeNull();
  });

  it('drives a deterministic finished bot-vs-bot game within maxRounds', () => {
    const initial = setupGame(
      { playerCount: 4, seed: 20260521 },
      DEFAULT_CONFIG,
    );
    const teamIds = allTeams(initial).map((team) => team.teamNumber);
    const strategies = new Map(
      teamIds.map(
        (teamId) => [teamId, randomStrategy(10_000 + teamId)] as const,
      ),
    );
    const provider = makeBotProvider(strategies);
    const first = runUntilGameOver(initial, provider, 100);
    const secondInitial = setupGame(
      { playerCount: 4, seed: 20260521 },
      DEFAULT_CONFIG,
    );
    const secondStrategies = new Map(
      allTeams(secondInitial).map(
        (team) =>
          [team.teamNumber, randomStrategy(10_000 + team.teamNumber)] as const,
      ),
    );
    const secondProvider = makeBotProvider(secondStrategies);
    const second = runUntilGameOver(secondInitial, secondProvider, 100);

    expect(isGameOver(first.state)).toBe(true);
    expect(first.rounds).toBeLessThanOrEqual(100);
    expect(first.winner).toBe(second.winner);
    expect(first.rounds).toBe(second.rounds);
    expect(first.state).toEqual(second.state);
  });

  it('returns null revival action when no legal revival option exists', () => {
    const team = makeTeam({
      id: 1 as NumberToken,
      position: fireWater,
      cards: [fire5],
      gridCards: [fire5, water3],
    });
    const state = {
      ...stateWith([team]),
      droppedLifeTokens: createEmptyDroppedTokens(),
    };
    const strategy = randomStrategy(4);

    expect(strategy.chooseRevivalAction(state, 1 as NumberToken)).toBeNull();
  });
});
