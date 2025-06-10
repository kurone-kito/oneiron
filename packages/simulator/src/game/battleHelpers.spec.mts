import type { Writable } from 'type-fest';
import { describe, expect, it } from 'vitest';
import type { CardType, Player, Team } from '../types.mjs';
import {
  applyDamage,
  checkTeamElimination,
  selectBattleCard,
  updatePlayer,
} from './battleHelpers.mjs';

const makeTeam = (life: number, alive = true): Team => ({
  id: 1,
  players: [
    { id: 'p1', name: 'P1', isBot: false, life, isAlive: alive, cards: [] },
  ],
  position: { x: 0, y: 0 },
  direction: 'north',
  gridCards: [],
  isEliminated: false,
});

const makeTeam2 = (
  id: number,
  cards: CardType[],
  pos = { x: 0, y: 0 },
): Team => ({
  id,
  players: [
    {
      id: `p${id}`,
      name: `P${id}`,
      isBot: false,
      life: 3,
      isAlive: true,
      cards: [...cards],
    },
  ],
  position: pos,
  direction: 'north',
  gridCards: [],
  isEliminated: false,
});

describe('applyDamage', () => {
  it('reduces life but not below zero', () => {
    let life = 1;
    life = applyDamage(life);
    expect(life).toBe(0);
    life = applyDamage(life);
    expect(life).toBe(0);
  });
});

describe('checkTeamElimination', () => {
  it('marks team eliminated when everyone is down', () => {
    const logs: string[] = [];
    const team = makeTeam(0, false);
    const result = checkTeamElimination(team, (m) => logs.push(m));
    expect(result.isEliminated).toBe(true);
    expect(logs[0]).toContain('敗北しました');
  });

  it('keeps team alive if a member survives', () => {
    const logs: string[] = [];
    const team = makeTeam(1, true);
    const result = checkTeamElimination(team, (m) => logs.push(m));
    expect(result.isEliminated).toBe(false);
    expect(logs.length).toBe(0);
  });
});

describe('selectBattleCard', () => {
  it('returns first card for human players', () => {
    const team = makeTeam2(1, [
      { attribute: 'fire', number: 1, type: 'attribute' },
      { attribute: 'water', number: 3, type: 'attribute' },
    ]);
    const player = team.players[0] as Player;
    const card = selectBattleCard(player);
    expect(card).toEqual({ attribute: 'fire', number: 1, type: 'attribute' });
  });

  it('chooses joker for bots when available', () => {
    const team = makeTeam2(1, [
      { attribute: 'fire', number: 1, type: 'attribute' },
      { type: 'joker' },
    ]);
    const player = team.players[0] as Writable<Player>;
    player.isBot = true;
    const card = selectBattleCard(player);
    expect(card).toEqual({ type: 'joker' });
  });

  it('chooses highest number card for bots', () => {
    const team = makeTeam2(1, [
      { attribute: 'fire', number: 1, type: 'attribute' },
      { attribute: 'fire', number: 5, type: 'attribute' },
    ]);
    const player = team.players[0] as Writable<Player>;
    player.isBot = true;
    const card = selectBattleCard(player);
    expect(card).toEqual({ attribute: 'fire', number: 5, type: 'attribute' });
  });
});

describe('updatePlayer', () => {
  it('applies damage and discards card immutably', () => {
    const player: Player = {
      id: 'p1',
      name: 'P1',
      isBot: false,
      life: 2,
      isAlive: true,
      cards: [{ attribute: 'fire', number: 1, type: 'attribute' }],
    };
    const discards: CardType[] = [];
    const updated = updatePlayer(
      player,
      { damage: true, discard: player.cards[0] as CardType },
      (c) => discards.push(c),
    );
    expect(updated.life).toBe(1);
    expect(updated.cards.length).toBe(0);
    expect(discards.length).toBe(1);
    // original object untouched
    expect(player.life).toBe(2);
    expect(player.cards.length).toBe(1);
  });
});
