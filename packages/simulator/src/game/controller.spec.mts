import { createRoot } from 'solid-js';
import { describe, expect, it } from 'vitest';
import { createGameController, createInitialState } from './controller.mjs';

describe('createInitialState', () => {
  it('uses provided player count', () => {
    const state = createInitialState(7);
    expect(state.currentPlayerCount).toBe(7);
    expect(state.phase).toBe('setup');
  });
});

describe('createGameController', () => {
  it('initializes and advances the game', () => {
    createRoot((dispose) => {
      const controller = createGameController(createInitialState());
      expect(controller.state.phase).toBe('setup');
      controller.initializeGame();
      expect(controller.state.phase).toBe('round0-prep');
      const logs = controller.log().length;
      controller.nextPhase();
      expect(controller.state.phase).toBe('round0-descent');
      expect(controller.log().length).toBeGreaterThanOrEqual(logs);
      dispose();
    });
  });
});
