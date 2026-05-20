import type { Card, Deck, ElementCard } from '../types/card.ts';
import { isElementCard } from '../types/card.ts';
import type { Facing, TeamState } from '../types/grid.ts';
import { ELEMENT_AXIS } from '../types/grid.ts';
import type { TeamId } from '../types/token.ts';
import type { RoundState, TeamMove } from './round.ts';

type ExplicitMovementChoice = {
  readonly kind: 'explicit';
  readonly teamId: TeamId;
  readonly intendedFacing: Facing;
  readonly gridSwapIndex?: 0 | 1;
  readonly card: Card;
};

type EmergencyDrawMovementChoice = {
  readonly kind: 'emergency-draw';
  readonly teamId: TeamId;
  readonly intendedFacing: Facing;
  readonly gridSwapIndex?: 0 | 1;
  readonly emergencyDrawPick?: 0 | 1;
};

export type MovementChoice =
  | ExplicitMovementChoice
  | EmergencyDrawMovementChoice;

type MovementEventLogger = (message: string) => void;

/**
 * Forbidden-phase Joker fallback: when the GM "draws" a Joker for
 * the forbidden cell coordinate, the rules call for an "attribute
 * card" but don't define joker semantics for the forbidden marker.
 * v1 uses 'fire' as a deterministic fallback element coordinate.
 */
const JOKER_FORBIDDEN_FALLBACK: ElementCard = {
  kind: 'element',
  element: 'fire',
  value: 1,
};

export function allTeams(state: RoundState): TeamState[] {
  const teams: TeamState[] = [];
  for (const x of ELEMENT_AXIS) {
    for (const y of ELEMENT_AXIS) {
      teams.push(...state.grid[x][y]);
    }
  }
  return teams;
}

export function findTeam(
  state: RoundState,
  teamId: TeamId,
): TeamState | undefined {
  return allTeams(state).find((team) => team.teamNumber === teamId);
}

export function isTeamAlive(team: TeamState): boolean {
  return team.players.some((player) => player.life > 0);
}

export function updateTeam(state: RoundState, updated: TeamState): RoundState {
  const { x, y } = updated.position;
  return {
    ...state,
    grid: {
      ...state.grid,
      [x]: {
        ...state.grid[x],
        [y]: state.grid[x][y].map((team) =>
          team.teamNumber === updated.teamNumber ? updated : team,
        ),
      },
    },
  } as RoundState;
}

/**
 * Draws up to `count` cards from the head of the deck.
 * Returns the drawn cards (in original order) and the remaining deck.
 * Caller is responsible for handling fewer-than-`count` draws.
 */
export function drawFromDeck(
  deck: Deck | undefined,
  count: number,
): { drawn: readonly Card[]; remaining: Deck } {
  const source = deck ?? [];
  const drawn = source.slice(0, count);
  const remaining = source.slice(count);
  return { drawn, remaining };
}

export function coerceToElementCard(card: Card): ElementCard {
  return isElementCard(card) ? card : JOKER_FORBIDDEN_FALLBACK;
}

export function resolveMovementChoices(
  state: RoundState,
  movementChoices: readonly MovementChoice[],
  onEvent?: MovementEventLogger,
): { state: RoundState; teamMoves: readonly TeamMove[] } {
  let next = state;
  const resolvedMoves: TeamMove[] = [];
  const choicesByTeam = new Map<TeamId, MovementChoice>();
  for (const choice of movementChoices) {
    choicesByTeam.set(choice.teamId, choice);
  }

  const candidateIds = new Set<TeamId>(choicesByTeam.keys());
  for (const team of allTeams(next)) {
    if (!isTeamAlive(team)) continue;
    if (team.cards.length === 0) {
      candidateIds.add(team.teamNumber);
    }
  }

  const orderedTeamIds = [...candidateIds].sort((a, b) => a - b);
  for (const teamId of orderedTeamIds) {
    const team = findTeam(next, teamId);
    if (team === undefined || !isTeamAlive(team)) continue;

    const choice = choicesByTeam.get(teamId);
    if (team.cards.length === 0) {
      if (choice?.kind === 'explicit') {
        throw new RangeError(
          `Team ${teamId} cannot use an explicit movement choice with an empty hand.`,
        );
      }

      const emergencyDraw = drawFromDeck(next.deck, 2);
      next = { ...next, deck: emergencyDraw.remaining };
      const [firstDrawnCard, secondDrawnCard] = emergencyDraw.drawn;
      if (firstDrawnCard === undefined) {
        onEvent?.(
          `Team ${teamId} had no cards in hand and the deck was exhausted`,
        );
        continue;
      }

      const replenishedTeam: TeamState = {
        ...team,
        cards: [...team.cards, ...emergencyDraw.drawn],
      };
      next = updateTeam(next, replenishedTeam);
      onEvent?.(
        `Team ${teamId} drew ${emergencyDraw.drawn.length} card(s) for the empty-hand movement fallback`,
      );
      if (choice?.kind !== 'emergency-draw') {
        onEvent?.(
          `Team ${teamId} had no movement submission after the empty-hand movement fallback draw`,
        );
        continue;
      }

      const selectedDrawIndex = choice.emergencyDrawPick ?? 0;
      const selectedCard =
        selectedDrawIndex === 1
          ? (secondDrawnCard ?? firstDrawnCard)
          : firstDrawnCard;

      resolvedMoves.push({
        teamId,
        card: selectedCard,
        intendedFacing: choice.intendedFacing,
        ...(choice.gridSwapIndex !== undefined
          ? { gridSwapIndex: choice.gridSwapIndex }
          : {}),
      });
      continue;
    }

    if (choice === undefined) continue;
    if (choice.kind === 'emergency-draw') {
      const [firstHandCard] = team.cards;
      if (firstHandCard === undefined) continue;

      resolvedMoves.push({
        teamId,
        card: firstHandCard,
        intendedFacing: choice.intendedFacing,
        ...(choice.gridSwapIndex !== undefined
          ? { gridSwapIndex: choice.gridSwapIndex }
          : {}),
      });
      continue;
    }

    resolvedMoves.push({
      teamId,
      card: choice.card,
      intendedFacing: choice.intendedFacing,
      ...(choice.gridSwapIndex !== undefined
        ? { gridSwapIndex: choice.gridSwapIndex }
        : {}),
    });
  }

  return { state: next, teamMoves: resolvedMoves };
}
