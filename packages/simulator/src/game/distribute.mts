import {
  ATTRIBUTES,
  ATTRIBUTE_EXTRACTION_MULTIPLIER,
  INITIAL_RANDOM_CARD_COUNT,
} from '../constants.mjs';
import type { CardType, Team } from '../types.mjs';
import { cloneTeam } from './cloning.mjs';
import { drawFirst, drawRandom } from './draw.mjs';

export interface DistributionResult {
  teams: Team[];
  deck: CardType[];
}

/** Result of drawing cards for a team. */
export interface TeamDrawResult {
  /** Updated team after drawing. */
  readonly team: Team;
  /** Remaining deck after drawing. */
  readonly deck: CardType[];
}

/**
 * Add a drawn card to the first player of the team immutably.
 *
 * @param team - Target team.
 * @param card - Card to add. Ignored when undefined.
 * @returns New team instance with updated first player's cards.
 */
export const addCardToLeader = (
  team: Team,
  card: CardType | undefined,
): Team => {
  if (!card || !team.players[0]) return team;
  const players = team.players.map((p, i) =>
    i === 0 ? { ...p, cards: [...p.cards, card] } : p,
  );
  return { ...team, players };
};

/**
 * Draw attribute cards for a team leader.
 * @param team - Team to add cards to.
 * @param deck - Source deck.
 * @returns Updated team and remaining deck.
 */
export const drawAttributeCardsForTeam = (
  team: Team,
  deck: readonly CardType[],
): TeamDrawResult =>
  ATTRIBUTES.reduce<TeamDrawResult>(
    (state, attr) =>
      Array.from({
        length: ATTRIBUTE_EXTRACTION_MULTIPLIER,
      }).reduce<TeamDrawResult>((acc) => {
        const fn = (c: CardType) =>
          c.type === 'attribute' && c.attribute === attr;
        const { deck: d, cards } = drawFirst(acc.deck, fn);
        return { deck: d, team: addCardToLeader(acc.team, cards[0]) };
      }, state),
    { team: cloneTeam(team), deck: [...deck] },
  );

/**
 * Draw random cards for a team leader.
 * @param team - Team to add cards to.
 * @param deck - Source deck.
 * @param count - Number of random draws.
 * @param rng - Random generator.
 * @returns Updated team and remaining deck.
 */
export const drawRandomCardsForTeam = (
  team: Team,
  deck: readonly CardType[],
  count = INITIAL_RANDOM_CARD_COUNT,
  rng: () => number = Math.random,
): TeamDrawResult =>
  Array.from({ length: count }).reduce<TeamDrawResult>(
    (acc) => {
      const { deck: d, cards } = drawRandom(acc.deck, rng);
      return { team: addCardToLeader(acc.team, cards[0]), deck: d };
    },
    { team: cloneTeam(team), deck: [...deck] },
  );

/**
 * Add a joker card for single member teams.
 * @param team - Team to modify.
 * @param deck - Source deck.
 * @returns Updated team and remaining deck.
 */
export const drawJokerForSingleTeam = (
  team: Team,
  deck: readonly CardType[],
): TeamDrawResult => {
  if (team.players.length !== 1) {
    return { team: cloneTeam(team), deck: [...deck] };
  }
  const res = drawFirst(deck, (c) => c.type === 'joker');
  return {
    team: addCardToLeader(cloneTeam(team), res.cards[0]),
    deck: res.deck,
  };
};

/**
 * Evenly distribute cards among team members.
 *
 * @param team - Team whose players will receive cards.
 * @param rng - Random number generator.
 * @returns Updated team with distributed cards.
 */
export const distributeCardsAmongPlayers = (
  team: Team,
  rng: () => number = Math.random,
): Team => {
  if (team.players.length === 0) return team;
  const cards = team.players.flatMap((p) => p.cards);
  const shuffled = [...cards].sort(() => rng() - 0.5);
  const base = Math.floor(shuffled.length / team.players.length);
  const extra = shuffled.length % team.players.length;
  let idx = 0;
  const players = team.players.map((p, i) => {
    const count = base + (i < extra ? 1 : 0);
    const slice = shuffled.slice(idx, idx + count);
    idx += count;
    return { ...p, cards: slice };
  });
  return { ...team, players };
};

/**
 * Distribute initial cards to teams based on game rules.
 * @param teams - Teams to distribute cards to.
 * @param deck - Deck of cards to draw from.
 * @param rng - Random number generator (default is Math.random).
 * @returns Distribution result containing updated teams and remaining deck.
 */
export const distributeInitialCards = (
  teams: readonly Team[],
  deck: readonly CardType[],
  rng: () => number = Math.random,
): DistributionResult =>
  teams.reduce<DistributionResult>(
    (acc, team) => {
      const a = drawAttributeCardsForTeam(team, acc.deck);
      const b = drawRandomCardsForTeam(
        a.team,
        a.deck,
        INITIAL_RANDOM_CARD_COUNT,
        rng,
      );
      const c = drawJokerForSingleTeam(b.team, b.deck);
      const d = distributeCardsAmongPlayers(c.team, rng);
      return { teams: [...acc.teams, d], deck: c.deck };
    },
    { teams: [], deck: [...deck] },
  );
