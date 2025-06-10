import { ATTRIBUTES, DIRECTIONS } from '../constants.mjs';
import type { CardType, Player, Team } from '../types.mjs';
import { setGridCell } from '../utils/grid.mjs';
import { cloneTeam } from './cloning.mjs';

/** Result of preparing teams for the descent phase. */
export interface DescentSetup {
  /** Updated teams after positioning. */
  teams: Team[];
  /** Grid with placed cards. */
  grid: (CardType | null)[][];
}

/** Result of preparing a single team during descent. */
export interface TeamDescent {
  readonly team: Team;
  readonly grid: (CardType | null)[][];
}

/**
 * Randomly pick cards from an array without mutating the original.
 *
 * @param cards - Source cards.
 * @param count - Number of cards to pick.
 * @param rng - Random number generator.
 * @returns Tuple of selected cards and remaining cards.
 */
export const pickRandomCards = (
  cards: readonly CardType[],
  count: number,
  rng: () => number = Math.random,
): readonly [readonly CardType[], readonly CardType[]] => {
  const pool = [...cards];
  const selected: CardType[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length);
    const [c] = pool.splice(idx, 1);
    if (c) selected.push(c);
  }
  return [selected, pool];
};

/**
 * Remove specified cards from each player's hand.
 *
 * @param players - Players to update.
 * @param cards - Cards to remove.
 * @returns New players array with cards removed.
 */
export const removeCardsFromPlayers = (
  players: readonly Player[],
  cards: readonly CardType[],
): Player[] => {
  const removeSet = new Set(cards);
  return players.map((p) => ({
    ...p,
    cards: p.cards.filter((c) => !removeSet.has(c)),
  }));
};

/**
 * Position a team on the grid and place initial cards.
 *
 * @param team - Team to adjust.
 * @param index - Team index used for default position.
 * @param grid - Current grid state.
 * @returns Adjusted team and updated grid.
 */
export const setupTeamDescent = (
  team: Team,
  index: number,
  grid: readonly (CardType | null)[][],
  rng: () => number = Math.random,
): TeamDescent => {
  const t = cloneTeam(team);
  const x = 1 + (index % 3);
  const y = 1 + Math.floor(index / 3);
  const dir = DIRECTIONS[(index % 4) as 0 | 1 | 2 | 3];
  const allCards = t.players.flatMap((p) => p.cards);
  const [gridCards] = pickRandomCards(allCards, 2, rng);
  const players = removeCardsFromPlayers(t.players, gridCards);
  const nextGrid = setGridCell(grid, x, y, gridCards[0] ?? null);
  return {
    team: { ...t, players, position: { x, y }, direction: dir, gridCards },
    grid: nextGrid,
  };
};

/**
 * Calculate team positions and initial grid cards for the first descent.
 *
 * This function does not mutate the provided arguments.
 *
 * @param teams - Teams before descent.
 * @param grid - Current grid state.
 * @returns Positioned teams and updated grid.
 */
export const prepareTeamsForDescent = (
  teams: readonly Team[],
  grid: readonly (CardType | null)[][],
  rng: () => number = Math.random,
): DescentSetup =>
  teams.reduce<DescentSetup>(
    ({ teams: acc, grid: current }, team, idx) => {
      const { team: nextTeam, grid: nextGrid } = setupTeamDescent(
        team,
        idx,
        current,
        rng,
      );
      return { teams: [...acc, nextTeam], grid: nextGrid };
    },
    { teams: [], grid: grid.map((row) => [...row]) },
  );

/**
 * Add coordinate attribute cards around the grid for the descent phase.
 *
 * @param grid - Current grid state.
 * @param rng - Random generator used for shuffling attributes.
 * @returns Grid with coordinate cards placed.
 */
export const applyCoordinateCards = (
  grid: readonly (CardType | null)[][],
  rng: () => number = Math.random,
): (CardType | null)[][] => {
  const shuffle = (
    attrs: readonly (typeof ATTRIBUTES)[number][],
  ): readonly (typeof ATTRIBUTES)[number][] =>
    [...attrs].sort(() => rng() - 0.5);

  /**
   * Helper to create a coordinate card.
   *
   * @param attr - Attribute to assign to the card.
   * @returns New attribute card.
   */
  const createCard = (attr: (typeof ATTRIBUTES)[number]): CardType => ({
    attribute: attr,
    number: 1,
    type: 'attribute',
  });

  const horizontal = shuffle(ATTRIBUTES);
  const vertical = shuffle(ATTRIBUTES);

  const withHorizontal = horizontal.reduce<(CardType | null)[][]>(
    (acc, attr, i) => setGridCell(acc, i + 1, 0, createCard(attr)),
    grid.map((row) => [...row]),
  );

  const withVertical = vertical.reduce<(CardType | null)[][]>(
    (acc, attr, i) => setGridCell(acc, 0, i + 1, createCard(attr)),
    withHorizontal,
  );

  return withVertical;
};
