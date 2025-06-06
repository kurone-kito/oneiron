import { phases } from '../constants/entities.mjs';
import type { ForbidCoordinates } from '../types/entities/board.mjs';
import type { GameState, Phase } from '../types/entities/game.mjs';
import type { Team } from '../types/entities/player.mjs';

/**
 * Creates the initial game state.
 * @param teams The teams participating in the game.
 * @param forbids The coordinates that are forbidden for movement.
 * @param round The current round number.
 * @param phase The current phase of the game.
 * @returns The initial game state.
 */
export const createGameState = (
  teams: readonly Team[],
  forbids: ForbidCoordinates = new Set(),
  round = 1,
  phase: Phase = 'battle',
): GameState => ({ teams, forbids, round, phase });

/**
 * Advances the game phase in a cyclic order.
 * @param state The current game state.
 * @returns The updated game state with the next phase.
 */
export const nextPhase = (state: GameState): GameState => {
  const index = phases.indexOf(state.phase);
  const phase = index >= 0 ? phases[(index + 1) % phases.length] : undefined;
  return phase ? { ...state, phase } : state;
};
