import type { GameConfig } from '../config.ts';
import type { Card, Element } from '../types/card.ts';
import { isElementCard, isJokerCard } from '../types/card.ts';
import type {
  ElementCoordinate,
  Facing,
  Grid,
  GridCoord,
  PlayerState,
  TeamState,
} from '../types/grid.ts';
import { ELEMENT_AXIS } from '../types/grid.ts';
import type { NumberToken } from '../types/token.ts';
import { createLifeToken } from '../types/token.ts';
import { buildDeck, createRng, shuffleDeck } from './deck.ts';
import type { RoundState } from './round.ts';
import { createEmptyGrid } from './round.ts';

const FACINGS: readonly Facing[] = ['north', 'east', 'south', 'west'];

const PAIR_TEAM_LIFE = 4;
const SOLO_TEAM_LIFE = 3;

/** Input shape for {@link setupGame}. */
export type SetupInput = {
  /** Total number of human players in the match (2..20). */
  readonly playerCount: number;
  /** Seed for the deterministic RNG used for shuffle and placement. */
  readonly seed: number;
};

function clampPlayerCount(playerCount: number): number {
  if (!Number.isInteger(playerCount) || playerCount < 1) {
    throw new RangeError('playerCount must be a positive integer.');
  }
  return playerCount;
}

function buildPlayers(life: number, members: 1 | 2): readonly PlayerState[] {
  if (members === 1) {
    return [{ life: createLifeToken(life) }];
  }
  const half = Math.floor(life / 2);
  const rest = life - half;
  return [{ life: createLifeToken(half) }, { life: createLifeToken(rest) }];
}

function takeOne<T>(pool: T[], rng: () => number): T {
  const i = Math.floor(rng() * pool.length);
  const picked = pool[i] as T;
  pool.splice(i, 1);
  return picked;
}

function pickFromShuffled<T>(
  pool: T[],
  predicate: (item: T) => boolean,
): T | undefined {
  for (let i = 0; i < pool.length; i++) {
    const item = pool[i] as T;
    if (predicate(item)) {
      pool.splice(i, 1);
      return item;
    }
  }
  return undefined;
}

function extractElementBatch(
  shuffled: Card[],
  element: Element,
  count: number,
): Card[] {
  const out: Card[] = [];
  for (let i = 0; i < count; i++) {
    const card = pickFromShuffled(
      shuffled,
      (c) => isElementCard(c) && c.element === element,
    );
    if (card !== undefined) out.push(card);
  }
  return out;
}

function extractJoker(shuffled: Card[]): Card | undefined {
  return pickFromShuffled(shuffled, isJokerCard);
}

function buildAllCoords(): GridCoord[] {
  const coords: GridCoord[] = [];
  for (const x of ELEMENT_AXIS) {
    for (const y of ELEMENT_AXIS) {
      coords.push({ x: x as ElementCoordinate, y: y as ElementCoordinate });
    }
  }
  return coords;
}

function setTeamInGrid(grid: Grid, team: TeamState): Grid {
  const { x, y } = team.position;
  const existing = grid[x][y];
  return {
    ...grid,
    [x]: { ...grid[x], [y]: [...existing, team] },
  } as Grid;
}

type TeamShape = { readonly id: NumberToken; readonly solo: boolean };

function planTeams(playerCount: number): readonly TeamShape[] {
  const teams: TeamShape[] = [];
  let id = 1;
  let remaining = playerCount;
  while (remaining > 0) {
    if (remaining === 1) {
      teams.push({ id: id as NumberToken, solo: true });
      remaining -= 1;
    } else {
      teams.push({ id: id as NumberToken, solo: false });
      remaining -= 2;
    }
    id += 1;
  }
  return teams;
}

/**
 * Produces the initial RoundState for a new game, following the
 * Round 0 Setup + Descent rules from `docs/rules.ja.md`:
 *
 * - Forms pair teams of 2 plus a solo team if playerCount is odd.
 * - Distributes life tokens (4 split per pair team, 3 for solo).
 * - Builds and shuffles the deck deterministically from `input.seed`.
 * - Extracts `(teamCount × deckExtractFactor) + 2` cards of each
 *   element from the shuffled deck and one Joker for setup.
 * - Deals `deckExtractFactor` cards of each element to each team
 *   (revealed), plus `randomCardsDealt` face-down random cards.
 * - Solo teams receive one additional Joker.
 * - Places each team on a random unique cell of the 3×3 grid with
 *   a random initial facing.
 */
export function setupGame(input: SetupInput, config: GameConfig): RoundState {
  const playerCount = clampPlayerCount(input.playerCount);
  const rng = createRng(input.seed);

  const teams = planTeams(playerCount);
  const teamCount = teams.length;

  // Build the full deck and shuffle.
  const full = buildDeck(config);
  const shuffled = shuffleDeck(full, rng);

  // Extract the setup batch from the shuffled deck.
  const elementBatchSize = teamCount * config.deckExtractFactor + 2;
  const setupBatches: Record<Element, Card[]> = {
    fire: extractElementBatch(shuffled, 'fire', elementBatchSize),
    water: extractElementBatch(shuffled, 'water', elementBatchSize),
    wood: extractElementBatch(shuffled, 'wood', elementBatchSize),
  };
  const setupJoker = extractJoker(shuffled);

  // Choose random unique grid coordinates for teams.
  const allCoords = buildAllCoords();
  if (teamCount > allCoords.length) {
    throw new RangeError(
      `teamCount=${teamCount} exceeds available grid cells (${allCoords.length}).`,
    );
  }
  const positions: GridCoord[] = [];
  for (let i = 0; i < teamCount; i++) {
    positions.push(takeOne(allCoords, rng));
  }

  let grid = createEmptyGrid();

  for (let t = 0; t < teamCount; t++) {
    const shape = teams[t] as TeamShape;
    const teamLife = shape.solo ? SOLO_TEAM_LIFE : PAIR_TEAM_LIFE;
    const players = buildPlayers(teamLife, shape.solo ? 1 : 2);

    // Deal revealed attribute cards (B per element).
    const hand: Card[] = [];
    for (const el of ['fire', 'water', 'wood'] as const) {
      for (let i = 0; i < config.deckExtractFactor; i++) {
        const card = setupBatches[el].shift();
        if (card !== undefined) hand.push(card);
      }
    }
    // Solo teams get one Joker.
    if (shape.solo && setupJoker !== undefined) {
      hand.push(setupJoker);
    }
    // Deal `randomCardsDealt` face-down random cards from the
    // remaining deck.
    for (let i = 0; i < config.randomCardsDealt; i++) {
      const card = shuffled.shift();
      if (card !== undefined) hand.push(card);
    }

    // Position cards: pick two element cards from hand to act as
    // the grid-positioning pair (the team's piece). For the rules,
    // these are placed face-up at the team's grid coordinate.
    const positioningCards: Card[] = [];
    for (let i = 0; i < 2 && i < hand.length; i++) {
      positioningCards.push(hand[i] as Card);
    }
    const remainingHand = hand.slice(2);

    const position = positions[t] as GridCoord;
    const facing = FACINGS[Math.floor(rng() * FACINGS.length)] as Facing;

    const team: TeamState = {
      teamNumber: shape.id,
      position,
      facing,
      cards: remainingHand,
      players,
      ...(positioningCards.length === 2
        ? {
            gridCards: [
              positioningCards[0] as Card,
              positioningCards[1] as Card,
            ] as const,
          }
        : {}),
    };

    grid = setTeamInGrid(grid, team);
  }

  return {
    phase: 'battle',
    round: 1,
    grid,
    forbiddenCells: [],
  };
}
