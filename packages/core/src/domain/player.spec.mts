import { describe, expect, it } from 'vitest';
import type { Card } from '../types/entities/card.mjs';
import type { Id } from '../types/entities/object.mjs';
import type { Player } from '../types/entities/player.mjs';
import { applyDamage, createPlayer, drawCard } from './player.mjs';

const basePlayer = {
  id: 'p1' as Id,
  hand: [],
  life: 10,
} as const satisfies Player;

describe('applyDamage', () => {
  it('subtracts life but not below zero', () => {
    const result = applyDamage({ ...basePlayer }, { value: 3 });
    expect(result.life).toBe(7);
    const zero = applyDamage({ ...basePlayer, life: 2 }, { value: 5 });
    expect(zero.life).toBe(0);
  });
});

describe('createPlayer', () => {
  it('creates player with default values', () => {
    const player = createPlayer();
    expect(player.life).toBe(4);
    expect(player.hand).toEqual([]);
  });
});

describe('drawCard', () => {
  it('adds card to hand without mutation', () => {
    const card = { id: 'c1' as Id, type: 'joker' } as const satisfies Card;
    const result = drawCard({ ...basePlayer }, card);
    expect(result.hand).toContain(card);
  });
});
