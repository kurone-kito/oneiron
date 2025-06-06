import { Text } from 'ink';
import { render } from 'ink-testing-library';
import { describe, expect, it, vi } from 'vitest';
import { useGameLoop } from './useGameLoop.mjs';

vi.useFakeTimers();

const HookTester = ({ count }: { count: number }) => {
  const { game, logs } = useGameLoop(count);
  return (
    <Text>
      {game.state.teams.length}:{logs.length}
    </Text>
  );
};

describe('useGameLoop', () => {
  it('initializes game with given player count', () => {
    const { lastFrame } = render(<HookTester count={2} />);
    expect(lastFrame()).toContain('2');
  });

  it('advances game over time', () => {
    const { lastFrame } = render(<HookTester count={1} />);
    vi.advanceTimersByTime(600);
    expect(lastFrame()).toMatch(/1:\d+/);
  });
});
