import {
  type GameController,
  createGameController,
} from '../game/controller.mjs';
import { useExposeToWindow } from './exposeToWindow.mjs';
import { useAutoAdvance } from './useAutoAdvance.mjs';

export interface SetupEffectsOptions {
  readonly exposeToWindow: typeof useExposeToWindow;
  readonly autoAdvance: typeof useAutoAdvance;
}

/** Options for {@link useGame}. */
export interface UseGameOptions {
  /** Factory to create a controller. */
  readonly create?: () => GameController;
  /** Function exposing value on window. */
  readonly exposeToWindow?: typeof useExposeToWindow;
  /** Auto advance hook. */
  readonly autoAdvance?: typeof useAutoAdvance;
}

/**
 * Attach side effects to the game controller.
 *
 * @param controller - Controller to operate on.
 * @param options - Effect implementations.
 */
export const setupControllerEffects = (
  controller: GameController,
  { exposeToWindow, autoAdvance }: SetupEffectsOptions,
): void => {
  exposeToWindow('__simulatorGame', controller);
  autoAdvance(
    () => controller.state.phase,
    () => controller.state.isAutoMode,
    () => controller.state.isPlaying,
    controller.nextPhase,
  );
};

/**
 * Setup the game controller with default side effects.
 *
 * This hook creates a controller, exposes it to the global window for
 * debugging and schedules automatic phase advancement.
 *
 * @param options - Optional dependencies for testing.
 * @returns The initialized game controller.
 */
export const useGame = (options: UseGameOptions = {}): GameController => {
  const {
    create = createGameController,
    exposeToWindow: expose = useExposeToWindow,
    autoAdvance = useAutoAdvance,
  } = options;
  const controller = create();
  setupControllerEffects(controller, { exposeToWindow: expose, autoAdvance });
  return controller;
};
