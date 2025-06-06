import type { Game } from '@kurone-kito/oneiron-core';
import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { GameScreen } from './GameScreen.js';

const game = {
  state: { round: 1, phase: 'battle', teams: [], forbids: new Set() },
  deck: [],
  agents: {},
} as unknown as Game;

describe('GameScreen', () => {
  it('shows status text', () => {
    const { lastFrame } = render(<GameScreen game={game} logs={['log']} />);
    const frame = lastFrame();
    expect(frame).toContain('ラウンド');
    expect(frame).toContain('log');
  });
});
