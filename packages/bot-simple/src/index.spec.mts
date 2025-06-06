import type {
  Card,
  GameState,
  Id,
  Player,
  Team,
} from '@kurone-kito/oneiron-core';
import { directions } from '@kurone-kito/oneiron-core';
import { describe, expect, it } from 'vitest';
import { createSimpleBotAgent, pickRandom } from './index.mjs';

const seq = (values: number[]) => {
  let i = 0;
  return () => values[i++] ?? 0;
};

const state = {} as GameState;

const baseToken = { id: 'n1' as Id, type: 'number', value: 1 } as const;
const basePlayer = (hand: readonly Card[]): Player => ({
  id: 'p1' as Id,
  life: 1,
  hand,
});

const baseTeam = (player: Player): Team => ({
  id: 't1' as Id,
  members: [player],
  token: baseToken,
  coordinate: { x: 0, y: 0 },
  direction: 'north',
});

describe('pickRandom', () => {
  it('picks item from list', () => {
    const result = pickRandom([1, 2, 3], seq([0]));
    expect(result).toBe(1);
  });
});

describe('createSimpleBotAgent', () => {
  it('selects a battle card', async () => {
    const card: Card = { id: 'c1' as Id, type: 'joker' };
    const agent = createSimpleBotAgent(seq([0]));
    const result = await agent.selectBattleCard(state, basePlayer([card]));
    expect(result).toBe(card);
  });

  it('selects movement card and direction', async () => {
    const card: Card = { id: 'c2' as Id, type: 'joker' };
    const agent = createSimpleBotAgent(seq([0, 0]));
    const team = baseTeam(basePlayer([card]));
    const result = await agent.selectMovement(state, team);
    expect(result).toEqual({ card, direction: directions[0] });
  });

  it('selects revive action', async () => {
    const agent = createSimpleBotAgent(seq([1]));
    const player = basePlayer([]);
    const action = await agent.selectReviveAction(state, player);
    expect(['salvage', 'chargeLife', 'chargeCards', undefined]).toContain(
      action,
    );
  });
});
