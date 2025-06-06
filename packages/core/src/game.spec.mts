import { describe, expect, it } from 'vitest';
import { createPlayer } from './domain/player.mjs';
import { createTeam } from './domain/team.mjs';
import { createGame, stepGame } from './game.mjs';
import type { PlayerAgent } from './types/agents/player.mjs';
import type { Card } from './types/entities/card.mjs';
import type { Id } from './types/entities/object.mjs';

const numberToken = { id: 'n1' as Id, type: 'number', value: 1 } as const;
const token2 = { id: 'n2' as Id, type: 'number', value: 2 } as const;

const fire: Card = { id: 'c1' as Id, type: 'pip', rank: 2, suit: 'fire' };
const wood: Card = { id: 'c2' as Id, type: 'pip', rank: 2, suit: 'wood' };

describe('game engine', () => {
  it('runs battle and updates state', async () => {
    const pa = createPlayer(2, [fire], 'pa' as Id);
    const pb = createPlayer(2, [wood], 'pb' as Id);
    const teamA = createTeam([pa], numberToken, { x: 0, y: 0 }, 'north');
    const teamB = createTeam([pb], token2, { x: 0, y: 0 }, 'north');
    const agents: Record<Id, PlayerAgent> = {
      [pa.id]: {
        selectBattleCard: async () => fire,
        selectMovement: async () => ({ card: fire, direction: 'east' }),
        selectReviveAction: async () => undefined,
      },
      [pb.id]: {
        selectBattleCard: async () => wood,
        selectMovement: async () => ({ card: wood, direction: 'east' }),
        selectReviveAction: async () => undefined,
      },
    };
    const game = createGame([teamA, teamB], agents, []);
    const afterBattle = await stepGame(game);
    expect(afterBattle.state.phase).toBe('forbidden');
    const loser = afterBattle.state.teams.find((t) => t.id === teamB.id)
      ?.members[0];
    expect(loser.life).toBe(1);
  });
});
