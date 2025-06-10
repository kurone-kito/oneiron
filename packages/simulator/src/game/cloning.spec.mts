import type { Writable } from 'type-fest';
import { describe, expect, it } from 'vitest';
import type { CardType, Player, Team } from '../types.mjs';
import { clonePlayer, cloneTeam, cloneTeams } from './cloning.mjs';

describe('clonePlayer', () => {
  const base: Player = {
    id: 'p1',
    name: 'P1',
    isBot: false,
    life: 3,
    isAlive: true,
    cards: [{ attribute: 'fire', number: 1, type: 'attribute' }],
  };

  it('creates a separate copy', () => {
    const copy = clonePlayer(base);
    expect(copy).not.toBe(base);
    (copy.cards as Writable<CardType[]>).push({ type: 'joker' });
    expect(base.cards.length).toBe(1);
  });
});

describe('cloneTeam', () => {
  const player: Player = {
    id: 'p1',
    name: 'P1',
    isBot: false,
    life: 3,
    isAlive: true,
    cards: [],
  };
  const base: Team = {
    id: 1,
    players: [player],
    position: { x: 0, y: 0 },
    direction: 'north',
    gridCards: [],
    isEliminated: false,
  };

  it('deeply clones team', () => {
    const copy = cloneTeam(base);
    expect(copy).not.toBe(base);
    expect(copy.players[0]).not.toBe(base.players[0]);
    (copy.players[0]?.cards as Writable<CardType[]>).push({ type: 'joker' });
    expect(base.players[0]?.cards.length).toBe(0);
  });
});

describe('cloneTeams', () => {
  it('clones each team instance', () => {
    const base1: Team = {
      id: 1,
      players: [],
      position: { x: 0, y: 0 },
      direction: 'north',
      gridCards: [],
      isEliminated: false,
    };
    const base2: Team = { ...base1, id: 2 };
    const copies = cloneTeams([base1, base2]);
    expect(copies.length).toBe(2);
    expect(copies[0]).not.toBe(base1);
    expect(copies[1]).not.toBe(base2);
  });
});
