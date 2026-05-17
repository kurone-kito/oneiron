import type { RoundPhase } from '../logic/round.ts';

/** A single line in the game event history. */
export type LogEntry = {
  readonly round: number;
  readonly phase: RoundPhase;
  readonly message: string;
};
