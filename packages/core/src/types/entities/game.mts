import type { ForbidCoordinates } from './board.mjs';
import type { Team } from './player.mjs';

/** Type definition for the game state. */
export interface GameState {
  /** The coordinates that are forbidden for movement. */
  readonly forbids: ForbidCoordinates;

  /** The current phase of the game. */
  readonly phase: Phase;

  /** The round number of the game. */
  readonly round: number;

  /** The teams participating in the game. */
  readonly teams: readonly Team[];
}

/** Type dealt with the phases of the game. */
export type Phase = 'battle' | 'forbidden' | 'movement' | 'revive';
