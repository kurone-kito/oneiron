import { describe, expect, it } from 'vitest';
import type { CardType, Team } from '../types.mjs';
import {
  applyBattleOutcome,
  compareCards,
  composeResultMessage,
  findAlivePlayerIndex,
  getAlivePlayer,
} from './battle.mjs';
import { replacePlayer } from './battleHelpers.mjs';
import type { BattleContext } from './outcome.mjs';
import {
  handleBothCards,
  handleNoCards,
  handleSingleCard,
} from './outcome.mjs';

const makeTeam = (id: number, cards: CardType[]): Team => ({
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
  position: { x: 0, y: 0 },
  direction: 'north',
  gridCards: [],
  isEliminated: false,
});

describe('getAlivePlayer', () => {
  it('returns first alive member', () => {
    const team = makeTeam(1, []);
    const player = getAlivePlayer(team);
    expect(player?.id).toBe('p1');
  });
});

describe('compareCards', () => {
  it('determines advantage correctly', () => {
    const a: CardType = { attribute: 'fire', number: 1, type: 'attribute' };
    const b: CardType = { attribute: 'wood', number: 1, type: 'attribute' };
    expect(compareCards(a, b)).toBe(1);
    expect(compareCards(b, a)).toBe(-1);
    expect(compareCards(a, a)).toBe(0);
  });
});

describe('applyBattleOutcome', () => {
  it('applies damage and logs result', () => {
    const t1 = makeTeam(1, [
      { attribute: 'fire', number: 1, type: 'attribute' },
    ]);
    const t2 = makeTeam(2, [
      { attribute: 'wood', number: 1, type: 'attribute' },
    ]);
    const logs: string[] = [];
    const discards: CardType[] = [];
    const [a, b] = applyBattleOutcome(
      [t1, t2],
      [t1.players[0]?.cards[0], t2.players[0]?.cards[0]],
      compareCards(t1.players[0]?.cards[0], t2.players[0]?.cards[0]),
      (m) => logs.push(m),
      (c) => discards.push(c),
    );
    expect(a.players[0]?.life).toBe(3);
    expect(b.players[0]?.life).toBe(2);
    expect(logs[0]).toContain('チーム1');
    expect(discards.length).toBe(2);
  });
});

describe('composeResultMessage', () => {
  it('returns correct messages', () => {
    expect(composeResultMessage(1, 1, 2)).toBe('チーム1の勝利');
    expect(composeResultMessage(-1, 1, 2)).toBe('チーム2の勝利');
    expect(composeResultMessage(0, 1, 2)).toBe('引き分け');
  });
});

describe('findAlivePlayerIndex & replacePlayer', () => {
  it('replaces the correct player', () => {
    const team = makeTeam(1, []);
    const idx = findAlivePlayerIndex(team);
    const base = team.players[idx] as NonNullable<
      (typeof team.players)[number]
    >;
    const updated = replacePlayer(team, idx, { ...base, life: 0 });
    expect(updated.players[idx]?.life).toBe(0);
    expect(team.players[idx]?.life).toBe(3);
  });
});

describe('outcome handlers', () => {
  const makeCtx = (): BattleContext => {
    const t1 = makeTeam(1, [
      { attribute: 'fire', number: 1, type: 'attribute' },
    ]);
    const t2 = makeTeam(2, [
      { attribute: 'wood', number: 1, type: 'attribute' },
    ]);
    return {
      teams: [makeTeam(1, []), makeTeam(2, [])],
      players: [
        t1.players[0] as NonNullable<(typeof t1.players)[number]>,
        t2.players[0] as NonNullable<(typeof t2.players)[number]>,
      ],
      indices: [0, 0],
      prefix: 'P:',
      log: () => {},
      onDiscard: () => {},
    };
  };

  it('handleNoCards returns original teams', () => {
    const ctx = makeCtx();
    const [a, b] = handleNoCards(ctx);
    expect(a).toBe(ctx.teams[0]);
    expect(b).toBe(ctx.teams[1]);
  });

  it('handleSingleCard applies damage', () => {
    const ctx = makeCtx();
    const [a] = handleSingleCard(ctx, 'a');
    expect(a.players[0]?.life).toBe(2);
  });

  it('handleBothCards discards cards', () => {
    const ctx = makeCtx();
    const [a, b] = handleBothCards(
      ctx,
      [
        ctx.players[0].cards[0] as CardType,
        ctx.players[1].cards[0] as CardType,
      ],
      1,
    );
    expect(a.players[0]?.cards.length).toBe(0);
    expect(b.players[0]?.cards.length).toBe(0);
  });
});
