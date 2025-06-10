import { createRoot } from 'solid-js';
import { describe, expect, it, vi } from 'vitest';
import type { GameController } from '../game/controller.mjs';
import type { GameState } from '../types.mjs';
import { useGame } from './useGame.mjs';

const makeController = (): GameController => ({
  state: { phase: 'setup', isAutoMode: false, isPlaying: true } as GameState,
  setState: vi.fn(),
  deck: vi.fn(),
  setDeck: vi.fn(),
  graveyard: vi.fn(),
  setGraveyard: vi.fn(),
  log: vi.fn(),
  initializeGame: vi.fn(),
  nextPhase: vi.fn(),
  addLog: vi.fn(),
});

describe('useGame', () => {
  it('creates controller and calls hooks', () => {
    const create = vi.fn(() => makeController());
    const expose = vi.fn();
    const auto = vi.fn();
    createRoot((dispose) => {
      const controller = useGame({
        create,
        exposeToWindow: expose,
        autoAdvance: auto,
      });
      expect(controller).toBeDefined();
      expect(create).toHaveBeenCalledTimes(1);
      expect(expose).toHaveBeenCalledWith('__simulatorGame', controller);
      expect(auto).toHaveBeenCalled();
      dispose();
    });
  });
});
