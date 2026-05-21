import type { Card } from '../types/card.ts';
import type { LogEntry } from '../types/log.ts';
import type { TeamId } from '../types/token.ts';
import type { BattlePlay } from './battle.ts';
import { resolveBattlePhase } from './battle.ts';
import {
  coerceToElementCard,
  drawFromDeck,
  type MovementChoice,
  resolveMovementChoices,
} from './phase-helpers.ts';
import type { BattleResult, RevivalAction, RoundState } from './round.ts';
import {
  advanceForbidden,
  advanceMovement,
  advanceRevival,
  isGameOver,
  winner,
} from './round.ts';

export type { MovementChoice } from './phase-helpers.ts';

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
      (message) => {
        log.push({ round, phase: 'movement', message });
      },
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
      message: `Movement resolution: ${resolvedMovement.teamMoves.length} moves resolved`,
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
