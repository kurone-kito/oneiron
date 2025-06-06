import { addForbidCoordinate } from './domain/board.mjs';
import { compareCard, createDeck } from './domain/card.mjs';
import { createGameState, nextPhase } from './domain/gameState.mjs';
import { applyDamage, drawCard } from './domain/player.mjs';
import type { PlayerAgent } from './types/agents/player.mjs';
import type {
  Coordinate,
  Coordinate2D,
  Direction,
} from './types/entities/board.mjs';
import type { Card } from './types/entities/card.mjs';
import type { GameState } from './types/entities/game.mjs';
import type { Id } from './types/entities/object.mjs';
import type { Team } from './types/entities/player.mjs';

export interface Game {
  readonly state: GameState;
  readonly deck: readonly Card[];
  readonly agents: Readonly<Record<Id, PlayerAgent>>;
}

export const createGame = (
  teams: readonly Team[],
  agents: Readonly<Record<Id, PlayerAgent>>,
  deck: readonly Card[] = createDeck(),
): Game => ({ state: createGameState(teams), deck, agents });

const moveCoordinate = (
  coord: Coordinate2D,
  direction: Direction,
): Coordinate2D => {
  const delta = {
    east: { x: 1, y: 0 },
    west: { x: -1, y: 0 },
    north: { x: 0, y: -1 },
    south: { x: 0, y: 1 },
  } as const;
  const next = {
    x: coord.x + delta[direction].x,
    y: coord.y + delta[direction].y,
  };
  return {
    x: Math.max(0, Math.min(4, next.x)) as typeof coord.x,
    y: Math.max(0, Math.min(4, next.y)) as typeof coord.y,
  };
};

type PhaseResult = { state: GameState; deck: readonly Card[] };

const battlePhase = async (
  state: GameState,
  deck: readonly Card[],
  agents: Readonly<Record<Id, PlayerAgent>>,
): Promise<PhaseResult> => {
  if (state.teams.length < 2) return { state, deck };
  const [a, b] = state.teams as readonly [Team, Team];
  const pa = a.members[0];
  const pb = b.members[0];
  const cardA = await agents[pa.id]?.selectBattleCard(state, pa);
  const cardB = await agents[pb.id]?.selectBattleCard(state, pb);
  if (!cardA || !cardB) return { state, deck };
  const result = compareCard(cardA, cardB);
  const updatedA = { ...pa, hand: pa.hand.filter((c) => c.id !== cardA.id) };
  const updatedB = { ...pb, hand: pb.hand.filter((c) => c.id !== cardB.id) };
  let teams = state.teams.map((t) =>
    t.id === a.id
      ? {
          ...t,
          members: [
            updatedA,
            ...(t.members.length > 1 ? [t.members[1]] : []),
          ] as unknown as typeof t.members,
        }
      : t.id === b.id
        ? {
            ...t,
            members: [
              updatedB,
              ...(t.members.length > 1 ? [t.members[1]] : []),
            ] as unknown as typeof t.members,
          }
        : t,
  );
  if (result === 'win') {
    const damaged = applyDamage(updatedB, { value: 1 });
    teams = teams.map((t) =>
      t.id === b.id
        ? {
            ...t,
            members: [
              damaged,
              ...(t.members.length > 1 ? [t.members[1]] : []),
            ] as unknown as typeof t.members,
          }
        : t,
    );
  } else if (result === 'lose') {
    const damaged = applyDamage(updatedA, { value: 1 });
    teams = teams.map((t) =>
      t.id === a.id
        ? {
            ...t,
            members: [
              damaged,
              ...(t.members.length > 1 ? [t.members[1]] : []),
            ] as unknown as typeof t.members,
          }
        : t,
    );
  }
  return { state: { ...state, teams }, deck };
};

const forbiddenPhase = async (
  state: GameState,
  deck: readonly Card[],
): Promise<PhaseResult> => {
  const coord: Coordinate2D = {
    x: Math.floor(Math.random() * 5) as Coordinate,
    y: Math.floor(Math.random() * 5) as Coordinate,
  };
  const forbids = addForbidCoordinate(state.forbids, coord);
  return { state: { ...state, forbids }, deck };
};

const movementPhase = async (
  state: GameState,
  deck: readonly Card[],
  agents: Readonly<Record<Id, PlayerAgent>>,
): Promise<PhaseResult> => {
  const teams = await Promise.all(
    state.teams.map(async (team) => {
      const agent = agents[team.members[0].id];
      if (!agent) return team;
      const move = await agent.selectMovement(state, team);
      const member = team.members[0];
      const newHand = member.hand.filter((c) => c.id !== move.card.id);
      const updatedMember = { ...member, hand: newHand };
      return {
        ...team,
        members: [
          updatedMember,
          ...(team.members.length > 1 ? [team.members[1]] : []),
        ] as unknown as typeof team.members,
        coordinate: move.direction
          ? moveCoordinate(team.coordinate, move.direction)
          : team.coordinate,
        direction: move.direction,
      };
    }),
  );
  return { state: { ...state, teams }, deck };
};

const revivePhase = async (
  state: GameState,
  deck: readonly Card[],
  agents: Readonly<Record<Id, PlayerAgent>>,
): Promise<PhaseResult> => {
  let restDeck = deck;
  const teams = await Promise.all(
    state.teams.map(async (team) => {
      const members = await Promise.all(
        team.members.map(async (player) => {
          if (player.life > 0) return player;
          const action = await agents[player.id]?.selectReviveAction(
            state,
            player,
          );
          if (action === 'chargeLife') return { ...player, life: 1 };
          if (action === 'chargeCards' && restDeck.length > 0) {
            const [card, ...next] = restDeck as readonly [Card, ...Card[]];
            restDeck = next;
            return drawCard({ ...player }, card);
          }
          return player;
        }),
      );
      return { ...team, members: members as unknown as typeof team.members };
    }),
  );
  return { state: { ...state, teams }, deck: restDeck };
};

export const stepGame = async (game: Game): Promise<Game> => {
  let { state, deck, agents } = game;
  if (state.phase === 'battle') {
    ({ state, deck } = await battlePhase(state, deck, agents));
  } else if (state.phase === 'forbidden') {
    ({ state, deck } = await forbiddenPhase(state, deck));
  } else if (state.phase === 'movement') {
    ({ state, deck } = await movementPhase(state, deck, agents));
  } else if (state.phase === 'revive') {
    ({ state, deck } = await revivePhase(state, deck, agents));
    state = { ...state, round: state.round + 1 };
  }
  state = nextPhase(state);
  return { state, deck, agents };
};
