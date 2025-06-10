import { fireEvent, render } from '@solidjs/testing-library';
import { createStore } from 'solid-js/store';
import { describe, expect, it, vi } from 'vitest';
import { GRID_SIZE } from '../../constants.mjs';
import type { createGameController } from '../../game/controller.mjs';
import type { GameState } from '../../types.mjs';
import { CardGameSimulator } from './CardGameSimulator.js';

const createStubController = () => {
  const [state, setState] = createStore<GameState>({
    phase: 'setup',
    round: 0,
    teams: [],
    grid: Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null)),
    forbiddenAreas: [],
    currentPlayerCount: 4,
    isAutoMode: false,
    isPlaying: true,
  });
  return {
    state,
    setState,
    deck: vi.fn().mockReturnValue([]),
    setDeck: vi.fn(),
    graveyard: vi.fn().mockReturnValue([]),
    setGraveyard: vi.fn(),
    log: vi.fn().mockReturnValue([]),
    initializeGame: vi.fn(() => setState('phase', 'round0-prep')),
    nextPhase: vi.fn(),
    addLog: vi.fn(),
  } as ReturnType<typeof createGameController>;
};

describe('CardGameSimulator', () => {
  it('starts the game via SetupForm', () => {
    const controller = createStubController();
    const { getByText } = render(() => (
      <CardGameSimulator createController={() => controller} />
    ));
    const start = getByText('ゲーム開始');
    fireEvent.click(start);
    expect(controller.initializeGame).toHaveBeenCalled();
  });
});
