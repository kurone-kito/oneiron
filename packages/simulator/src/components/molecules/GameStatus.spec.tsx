import { fireEvent, render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import type { GameState } from '../../types.mjs';
import { GameStatus } from './GameStatus.js';

describe('GameStatus', () => {
  const base: GameState = {
    phase: 'battle',
    round: 1,
    teams: [],
    grid: [],
    forbiddenAreas: [],
    currentPlayerCount: 2,
    isAutoMode: false,
    isPlaying: true,
  };

  it('shows phase info and handles button', async () => {
    const next = vi.fn();
    const { getByText } = render(() => (
      <GameStatus state={base} deckCount={1} graveyardCount={0} next={next} />
    ));
    getByText('フェーズ:');
    getByText('バトル');
    const btn = getByText('次のフェーズ');
    await fireEvent.click(btn);
    expect(next).toHaveBeenCalled();
  });

  it('hides button when finished', () => {
    const { queryByText } = render(() => (
      <GameStatus
        state={{ ...base, phase: 'finished' }}
        deckCount={1}
        graveyardCount={0}
        next={() => {}}
      />
    ));
    expect(queryByText('次のフェーズ')).toBeNull();
  });
});
