import type { Card, Deck, ElementCard } from '../types/card.ts';
import { isElementCard } from '../types/card.ts';
import type { Facing, TeamState } from '../types/grid.ts';
import { ELEMENT_AXIS } from '../types/grid.ts';
import type { LogEntry } from '../types/log.ts';
import type { TeamId } from '../types/token.ts';
import type { BattlePlay } from './battle.ts';
import { resolveBattlePhase } from './battle.ts';
import type {
  BattleResult,
  RevivalAction,
  RoundState,
  TeamMove,
} from './round.ts';
import {
  advanceForbidden,
  advanceMovement,
  advanceRevival,
  isGameOver,
  winner,
} from './round.ts';

type ExplicitMovementChoice = {
  readonly kind: 'explicit';
  readonly teamId: TeamId;
  readonly intendedFacing: Facing;
  readonly gridSwapIndex?: 0 | 1;
  /** Explicit card choice for a team that already has cards in hand. */
  readonly card: Card;
};

type EmergencyDrawMovementChoice = {
  readonly kind: 'emergency-draw';
  readonly teamId: TeamId;
  readonly intendedFacing: Facing;
  readonly gridSwapIndex?: 0 | 1;
  /**
   * Optional emergency-draw pick for a hand-empty team. `0` chooses
   * the first drawn card, `1` the second. When omitted or unavailable,
   * the runner falls back to the first drawn card.
   */
  readonly emergencyDrawPick?: 0 | 1;
};

export type MovementChoice =
  | ExplicitMovementChoice
  | EmergencyDrawMovementChoice;

/**
 * Inputs for a single round, one bundle per phase.
 *
 * Forbidden and movement-attribute draws are NOT in inputs — they
 * come from `state.deck`, drawn by the runner. Callers only supply
 * player-controlled decisions (battle plays, movement choices,
 * revival actions).
 */
export type RoundInputs = {
  readonly battle: {
    readonly plays: readonly BattlePlay[];
  };
  readonly movement: {
    readonly teamMoves: readonly MovementChoice[];
  };
  readonly revival: {
    readonly choices: ReadonlyMap<TeamId, RevivalAction>;
  };
};

/** Output of a single round: new state, battle results, log entries. */
export type RoundOutput = {
  readonly state: RoundState;
  readonly battleResults: readonly BattleResult[];
  readonly log: readonly LogEntry[];
};

function battleLogMessage(result: BattleResult): string {
  if (result.winner === null) {
    return `Team ${result.teamA} drew with Team ${result.teamB} (${result.encounterType})`;
  }
  const loser = result.winner === result.teamA ? result.teamB : result.teamA;
  return `Team ${result.winner} hit Team ${loser} for ${result.damage} damage (${result.encounterType})`;
}

/**
 * Draws up to `count` cards from the head of the deck.
 * Returns the drawn cards (in original order) and the remaining deck.
 * Caller is responsible for handling fewer-than-`count` draws.
 */
function drawFromDeck(
  deck: Deck | undefined,
  count: number,
): { drawn: readonly Card[]; remaining: Deck } {
  const source = deck ?? [];
  const drawn = source.slice(0, count);
  const remaining = source.slice(count);
  return { drawn, remaining };
}

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

function coerceToElementCard(card: Card): ElementCard {
  return isElementCard(card) ? card : JOKER_FORBIDDEN_FALLBACK;
}

function allTeams(state: RoundState): TeamState[] {
  const teams: TeamState[] = [];
  for (const x of ELEMENT_AXIS) {
    for (const y of ELEMENT_AXIS) {
      teams.push(...state.grid[x][y]);
    }
  }
  return teams;
}

function findTeam(state: RoundState, teamId: TeamId): TeamState | undefined {
  return allTeams(state).find((team) => team.teamNumber === teamId);
}

function isTeamAlive(team: TeamState): boolean {
  return team.players.some((player) => player.life > 0);
}

function updateTeam(state: RoundState, updated: TeamState): RoundState {
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

function resolveMovementChoices(
  state: RoundState,
  movementChoices: readonly MovementChoice[],
  round: number,
  log: LogEntry[],
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

  // Process every movement candidate in one team-number order so
  // explicit submissions and emergency draws both stay deterministic
  // regardless of submission order. This remains safe because
  // movement later resolves each team's state independently.
  const orderedTeamIds = [...candidateIds].sort((a, b) => a - b);
  for (const teamId of orderedTeamIds) {
    const team = findTeam(next, teamId);
    if (team === undefined || !isTeamAlive(team)) continue;

    const choice = choicesByTeam.get(teamId);
    if (team.cards.length === 0) {
      const emergencyDraw = drawFromDeck(next.deck, 2);
      next = { ...next, deck: emergencyDraw.remaining };
      if (emergencyDraw.drawn.length === 0) {
        log.push({
          round,
          phase: 'movement',
          message: `Team ${teamId} had no cards in hand and the deck was exhausted`,
        });
        continue;
      }

      const replenishedTeam: TeamState = {
        ...team,
        cards: [...team.cards, ...emergencyDraw.drawn],
      };
      next = updateTeam(next, replenishedTeam);
      const selectedDrawIndex =
        choice?.kind === 'emergency-draw' ? (choice.emergencyDrawPick ?? 0) : 0;
      const selectedCard =
        emergencyDraw.drawn[selectedDrawIndex] ?? emergencyDraw.drawn[0];

      resolvedMoves.push({
        teamId,
        card: selectedCard as Card,
        intendedFacing: choice?.intendedFacing ?? team.facing,
        ...(choice?.gridSwapIndex !== undefined
          ? { gridSwapIndex: choice.gridSwapIndex }
          : {}),
      });

      log.push({
        round,
        phase: 'movement',
        message: `Team ${teamId} drew ${emergencyDraw.drawn.length} card(s) for the empty-hand movement fallback`,
      });
      continue;
    }

    if (choice === undefined) continue;
    if (choice.kind !== 'explicit') {
      throw new RangeError(
        `Team ${teamId} must use an explicit movement choice while cards remain in hand.`,
      );
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

/**
 * Runs the four phases of a single round in order:
 *   battle → forbidden → movement → revival.
 *
 * After each phase, checks {@link isGameOver}; if true, subsequent
 * phases are skipped and the partial log is returned. Battle results
 * are always taken from the (possibly empty) battle phase output.
 *
 * Forbidden and movement-attribute cards are drawn from
 * `state.deck`. When the deck has fewer cards than the phase
 * requires, the phase is skipped and a "deck exhausted" log entry
 * is recorded (the game continues with no new forbidden cell or no
 * movement that round).
 *
 * Note: the returned state's `round` number is incremented by the
 * revival phase to indicate the next round. If revival is skipped
 * due to early game-over, the round number stays at the value the
 * battle phase saw.
 */
export function runRound(state: RoundState, inputs: RoundInputs): RoundOutput {
  const round = state.round;
  const log: LogEntry[] = [];

  // Phase 1: battle
  const battleOut = resolveBattlePhase(state, inputs.battle.plays);
  let next = battleOut.state;
  const battleResults = battleOut.results;
  for (const result of battleResults) {
    log.push({ round, phase: 'battle', message: battleLogMessage(result) });
  }
  if (isGameOver(next)) {
    return { state: next, battleResults, log };
  }

  // Phase 2: forbidden — draw 2 cards from state.deck.
  const forbiddenDraw = drawFromDeck(next.deck, 2);
  if (forbiddenDraw.drawn.length < 2) {
    log.push({
      round,
      phase: 'forbidden',
      message: 'Deck exhausted: forbidden phase skipped',
    });
  } else {
    const cardX = coerceToElementCard(forbiddenDraw.drawn[0] as Card);
    const cardY = coerceToElementCard(forbiddenDraw.drawn[1] as Card);
    next = advanceForbidden({ ...next, deck: forbiddenDraw.remaining }, [
      cardX,
      cardY,
    ]);
    log.push({
      round,
      phase: 'forbidden',
      message: `New forbidden cell: (${cardX.element}, ${cardY.element})`,
    });
  }
  if (isGameOver(next)) {
    return { state: next, battleResults, log };
  }

  // Phase 3: movement — draw 1 card from state.deck for attribute.
  const moveDraw = drawFromDeck(next.deck, 1);
  if (moveDraw.drawn.length < 1) {
    log.push({
      round,
      phase: 'movement',
      message: 'Deck exhausted: movement phase skipped',
    });
  } else {
    const drawn = moveDraw.drawn[0] as Card;
    const attrCard = coerceToElementCard(drawn);
    log.push({
      round,
      phase: 'movement',
      message: `Movement attribute: ${attrCard.element}`,
    });
    const movementInputState: RoundState = {
      ...next,
      deck: moveDraw.remaining,
    };
    const resolvedMovement = resolveMovementChoices(
      movementInputState,
      inputs.movement.teamMoves,
      round,
      log,
    );
    const beforeMovement = resolvedMovement.state;
    next = advanceMovement(
      beforeMovement,
      attrCard.element,
      resolvedMovement.teamMoves,
    );
    log.push({
      round,
      phase: 'movement',
      message: `Movement resolution: ${resolvedMovement.teamMoves.length} moves submitted`,
    });
    const movementPenalties = countTokenDelta(beforeMovement, next);
    if (movementPenalties > 0) {
      log.push({
        round,
        phase: 'movement',
        message: `Forbidden-cell penalty dropped ${movementPenalties} life token(s)`,
      });
    }
  }
  if (isGameOver(next)) {
    return { state: next, battleResults, log };
  }

  // Phase 4: revival
  next = advanceRevival(next, inputs.revival.choices);
  for (const [teamId, action] of inputs.revival.choices) {
    log.push({
      round,
      phase: 'revival',
      message: `Team ${teamId} chose ${action.type}`,
    });
  }

  return { state: next, battleResults, log };
}

function countTokenDelta(a: RoundState, b: RoundState): number {
  const tokensA = a.droppedLifeTokens;
  const tokensB = b.droppedLifeTokens;
  if (tokensA === undefined && tokensB === undefined) return 0;
  let delta = 0;
  for (const x of ['fire', 'water', 'wood'] as const) {
    for (const y of ['fire', 'water', 'wood'] as const) {
      const va = tokensA?.[x]?.[y] ?? 0;
      const vb = tokensB?.[x]?.[y] ?? 0;
      delta += vb - va;
    }
  }
  return Math.max(0, delta);
}

/** A function that supplies inputs for the next round given current state. */
export type InputProvider = (state: RoundState) => RoundInputs;

/** Result of {@link runUntilGameOver}. */
export type GameRunResult = {
  readonly state: RoundState;
  readonly log: readonly LogEntry[];
  readonly winner: TeamId | null;
  readonly rounds: number;
};

const DEFAULT_MAX_ROUNDS = 50;

/**
 * Runs `runRound` in a loop, calling `inputProvider` to obtain inputs
 * for each round, until {@link isGameOver} returns true or
 * `maxRounds` is reached. Returns the final state, the accumulated
 * log, the winning team (or null on tie/exhaustion), and the number
 * of rounds executed.
 */
export function runUntilGameOver(
  state: RoundState,
  inputProvider: InputProvider,
  maxRounds: number = DEFAULT_MAX_ROUNDS,
): GameRunResult {
  const log: LogEntry[] = [];
  let current = state;
  let rounds = 0;
  while (rounds < maxRounds && !isGameOver(current)) {
    const inputs = inputProvider(current);
    const out = runRound(current, inputs);
    current = out.state;
    log.push(...out.log);
    rounds += 1;
  }
  return {
    state: current,
    log,
    winner: winner(current),
    rounds,
  };
}
