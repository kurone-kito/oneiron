import { describe, expect, it } from 'vitest';
import { ATTRIBUTES } from '../constants.mjs';
import { createDeck } from '../deck.mjs';
import type { Team } from '../types.mjs';
import {
  addCardToLeader,
  distributeInitialCards,
  drawAttributeCardsForTeam,
  drawJokerForSingleTeam,
  drawRandomCardsForTeam,
} from './distribute.mjs';
import { drawAt, drawFirst, drawRandom } from './draw.mjs';
import { createTeams } from './setup.mjs';

describe('distributeInitialCards', () => {
  it('distributes cards among players', () => {
    const teams = createTeams(2, false);
    const deck = createDeck();
    const { teams: updated, deck: remaining } = distributeInitialCards(
      teams,
      deck,
      () => 0,
    );
    const p0 = updated[0]?.players[0]?.cards.length ?? 0;
    const p1 = updated[0]?.players[1]?.cards.length ?? 0;
    expect(Math.abs(p0 - p1)).toBeLessThanOrEqual(1);
    expect(p0 + p1).toBeGreaterThanOrEqual(5);
    for (const a of ATTRIBUTES) {
      const hasAttr = updated[0]?.players.some((pl) =>
        pl.cards.some((c) => c.type === 'attribute' && c.attribute === a),
      );
      expect(hasAttr).toBe(true);
    }
    expect(remaining.length).toBeLessThan(deck.length);
  });

  it('adds a joker when team has single member', () => {
    const teams = createTeams(1, false);
    const deck = createDeck();
    const { teams: updated } = distributeInitialCards(teams, deck, () => 0);
    const cards = updated[0]?.players[0]?.cards ?? [];
    expect(cards.some((c) => c.type === 'joker')).toBe(true);
  });

  it('drawFirst removes matching card', () => {
    const deck = [
      { attribute: 'fire', number: 1, type: 'attribute' },
      { attribute: 'water', number: 2, type: 'attribute' },
    ] as const;
    const { deck: rest, cards } = drawFirst(
      deck,
      (c) => c.type === 'attribute' && c.attribute === 'water',
    );
    expect(cards[0]).toEqual({
      attribute: 'water',
      number: 2,
      type: 'attribute',
    });
    expect(rest.length).toBe(1);
  });

  it('drawRandom selects deterministic card with rng', () => {
    const deck = [
      { attribute: 'fire', number: 1, type: 'attribute' },
      { attribute: 'water', number: 2, type: 'attribute' },
    ] as const;
    const { cards } = drawRandom(deck, () => 0);
    expect(cards[0]).toEqual({
      attribute: 'fire',
      number: 1,
      type: 'attribute',
    });
  });

  it('drawAt extracts card by index', () => {
    const deck = [
      { attribute: 'fire', number: 1, type: 'attribute' },
      { attribute: 'water', number: 2, type: 'attribute' },
    ] as const;
    const { deck: rest, cards } = drawAt(deck, 1);
    expect(cards[0]).toEqual({
      attribute: 'water',
      number: 2,
      type: 'attribute',
    });
    expect(rest).toEqual([{ attribute: 'fire', number: 1, type: 'attribute' }]);
  });
});

describe('addCardToLeader', () => {
  it('appends card immutably', () => {
    const teams = createTeams(2, false);
    const team = teams[0] as (typeof teams)[number];
    const updated = addCardToLeader(team, {
      attribute: 'fire',
      number: 1,
      type: 'attribute',
    });
    expect(updated.players[0]?.cards.length).toBe(1);
    expect(team.players[0]?.cards.length).toBe(0);
  });
});

describe('drawAttributeCardsForTeam & drawRandomCardsForTeam', () => {
  it('adds cards and reduces deck', () => {
    const teams = createTeams(2, false);
    const deck = createDeck();
    const { team: t1, deck: rest1 } = drawAttributeCardsForTeam(
      teams[0] as Team,
      deck,
    );
    const { team: t2, deck: rest2 } = drawRandomCardsForTeam(
      t1,
      rest1,
      1,
      () => 0,
    );
    expect(t2.players[0]?.cards.length).toBeGreaterThan(
      t1.players[0]?.cards.length ?? 0,
    );
    expect(rest2.length).toBe(rest1.length - 1);
  });
});

describe('drawJokerForSingleTeam', () => {
  it('adds joker when team has single member', () => {
    const teams = createTeams(1, false);
    const deck = createDeck();
    const { team: t } = drawJokerForSingleTeam(teams[0] as Team, deck);
    expect(
      t.players[0]?.cards.some((c) => 'type' in c && c.type === 'joker'),
    ).toBe(true);
  });

  it('returns identical team when not single', () => {
    const teams = createTeams(2, false);
    const deck = createDeck();
    const { team: t, deck: rest } = drawJokerForSingleTeam(
      teams[0] as Team,
      deck,
    );
    expect(t.players[0]?.cards.length).toBe(0);
    expect(rest.length).toBe(deck.length);
  });
});

describe('edge cases for draw functions', () => {
  it('returns same team when attribute cards are missing', () => {
    const teams = createTeams(2, false);
    const { team, deck } = drawAttributeCardsForTeam(teams[0] as Team, []);
    expect(team).toEqual(teams[0]);
    expect(deck).toEqual([]);
  });

  it('draws only available random cards', () => {
    const teams = createTeams(2, false);
    const deck = [{ attribute: 'fire', number: 1, type: 'attribute' }] as const;
    const { team, deck: rest } = drawRandomCardsForTeam(
      teams[0] as Team,
      deck,
      3,
      () => 0,
    );
    expect(team.players[0]?.cards.length).toBe(1);
    expect(rest.length).toBe(0);
  });
});
