import { describe, expect, it } from 'vitest';
import { GRID_SIZE } from '../constants.mjs';
import type { CardType, Team } from '../types.mjs';
import {
  applyCoordinateCards,
  pickRandomCards,
  prepareTeamsForDescent,
  removeCardsFromPlayers,
  setupTeamDescent,
} from './descent.mjs';
import { createTeams } from './setup.mjs';

const baseGrid = Array(GRID_SIZE)
  .fill(null)
  .map(() => Array(GRID_SIZE).fill(null));

describe('prepareTeamsForDescent', () => {
  it('positions teams and places grid cards', () => {
    const baseTeams = createTeams(4, false);
    const teams = baseTeams.map((t, i) =>
      i === 0 && t.players[0]
        ? {
            ...t,
            players: [
              {
                ...t.players[0],
                cards: [
                  { attribute: 'fire', number: 1, type: 'attribute' } as const,
                  { attribute: 'water', number: 1, type: 'attribute' } as const,
                  { attribute: 'wood', number: 1, type: 'attribute' } as const,
                ],
              },
              ...t.players.slice(1),
            ],
          }
        : t,
    );
    const { teams: updated, grid } = prepareTeamsForDescent(
      teams,
      baseGrid,
      () => 0,
    );
    expect(updated[0]?.position).toEqual({ x: 1, y: 1 });
    expect(updated[0]?.players[0]?.cards.length).toBe(1);
    expect(grid[1]?.[1]).not.toBeNull();
    expect(teams[0]?.players[0]?.cards.length).toBe(3); // original not mutated
  });
});

describe('setupTeamDescent', () => {
  it('returns updated team and grid immutably', () => {
    const baseTeams = createTeams(1, false);
    const base = baseTeams[0] as Team;
    const team0: Team = {
      ...base,
      players: [
        {
          ...(base.players[0] as NonNullable<(typeof base.players)[number]>),
          cards: [
            { attribute: 'fire', number: 1, type: 'attribute' } as const,
            { attribute: 'water', number: 1, type: 'attribute' } as const,
          ],
        },
      ],
    };
    const { team, grid } = setupTeamDescent(team0, 0, baseGrid, () => 0);
    expect(team.position).toEqual({ x: 1, y: 1 });
    expect(team.players[0]?.cards.length).toBe(0);
    expect(grid[1]?.[1]).not.toBeNull();
    expect(baseTeams[0]?.players[0]?.cards.length).toBe(0);
  });
});

describe('pickRandomCards', () => {
  it('selects requested number of cards without mutating source', () => {
    const cards = [
      { type: 'joker' } as const,
      { attribute: 'fire', number: 1, type: 'attribute' } as const,
    ];
    const [selected, rest] = pickRandomCards(cards, 1, () => 0);
    expect(selected.length).toBe(1);
    expect(rest.length).toBe(1);
    expect(cards.length).toBe(2);
  });
});

describe('removeCardsFromPlayers', () => {
  it('removes cards from each player', () => {
    const [team] = createTeams(1, false);
    if (!team) throw new Error('missing team');
    const players = team.players.map((p) => ({
      ...p,
      cards: [
        { attribute: 'fire', number: 1, type: 'attribute' } as const,
        { attribute: 'water', number: 1, type: 'attribute' } as const,
      ],
    }));
    const first = players[0];
    if (!first) throw new Error('missing player');
    const updated = removeCardsFromPlayers(players, [
      first.cards[0] as CardType,
    ]);
    expect(updated[0]?.cards.length).toBe(1);
  });
});

describe('applyCoordinateCards', () => {
  it('places attribute cards around the grid without mutation', () => {
    const grid = baseGrid;
    const next = applyCoordinateCards(grid, () => 0);
    expect(next[0]?.[1]).not.toBeNull();
    expect(next[1]?.[0]).not.toBeNull();
    expect(grid[0]?.[1]).toBeNull();
    expect(grid[1]?.[0]).toBeNull();
  });
});
