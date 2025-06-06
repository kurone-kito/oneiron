import { render } from 'ink-testing-library';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App.js';

vi.useFakeTimers();

describe('App', () => {
  it('renders setup modal initially', () => {
    const { lastFrame } = render(<App />);
    expect(lastFrame()).toContain('プレイヤー数');
  });
});
