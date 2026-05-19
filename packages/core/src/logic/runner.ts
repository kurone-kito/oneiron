import type { Card, Element, ElementCard } from '../types/card.ts';
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

/** Inputs for a single round, one bundle per phase. */
export type RoundInputs = {
  readonly battle: {
    readonly plays: readonly BattlePlay[];
  };
  readonly movement: {
    readonly teamMoves: readonly TeamMove[];
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

const JOKER_PHASE_ELEMENT: Element = 'fire';

function drawCards(
  deck: RoundState['deck'],
  count: number,
):
  | {
      readonly drawn: readonly Card[];
      readonly remainingDeck: readonly Card[];
    }
  | undefined {
  if (deck === undefined || deck.length < count) {
    return undefined;
  }
  return {
    drawn: deck.slice(0, count),
    remainingDeck: deck.slice(count),
  };
}

function phaseElement(card: Card): Element {
  return card.kind === 'element' ? card.element : JOKER_PHASE_ELEMENT;
}

function forbiddenCard(card: Card): ElementCard {
  if (card.kind === 'element') {
    return card;
  }
  // Jokers do not encode an element, so keep runner-controlled draws deterministic.
  return { kind: 'element', element: JOKER_PHASE_ELEMENT, value: 1 };
}

/**
 * Runs the four phases of a single round in order:
 *   battle → forbidden → movement → revival.
 *
 * The runner self-draws the forbidden and movement phase cards from
 * `state.deck`. If the deck cannot satisfy a phase's draw count, that
 * phase is skipped with a `deck exhausted` log entry.
 *
 * After each phase, checks {@link isGameOver}; if true, subsequent
 * phases are skipped and the partial log is returned. Battle results
 * are always taken from the (possibly empty) battle phase output.
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

  // Phase 2: forbidden
  const forbiddenDraw = drawCards(next.deck, 2);
  if (forbiddenDraw === undefined) {
    next = { ...next, phase: 'movement' };
    log.push({
      round,
      phase: 'forbidden',
      message: 'Forbidden phase skipped: deck exhausted',
    });
  } else {
    const drawnCards = [
      forbiddenCard(forbiddenDraw.drawn[0] as Card),
      forbiddenCard(forbiddenDraw.drawn[1] as Card),
    ] as const;
    next = advanceForbidden(
      { ...next, deck: forbiddenDraw.remainingDeck },
      drawnCards,
    );
    log.push({
      round,
      phase: 'forbidden',
      message: `New forbidden cell: (${drawnCards[0].element}, ${drawnCards[1].element})`,
    });
  }
  if (isGameOver(next)) {
    return { state: next, battleResults, log };
  }

  // Phase 3: movement
  const movementDraw = drawCards(next.deck, 1);
  if (movementDraw === undefined) {
    next = { ...next, phase: 'revival' };
    log.push({
      round,
      phase: 'movement',
      message: 'Movement phase skipped: deck exhausted',
    });
  } else {
    const movementAttribute = phaseElement(movementDraw.drawn[0] as Card);
    const beforeMovement = { ...next, deck: movementDraw.remainingDeck };
    next = advanceMovement(
      beforeMovement,
      movementAttribute,
      inputs.movement.teamMoves,
    );
    log.push({
      round,
      phase: 'movement',
      message: `Movement attribute: ${movementAttribute} (${inputs.movement.teamMoves.length} moves submitted)`,
    });
    // Tally any forbidden-cell penalties applied during movement.
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
