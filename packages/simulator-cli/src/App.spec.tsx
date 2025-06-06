import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { App } from './App.js';

describe('App', () => {
  it('renders setup modal', () => {
    const { lastFrame } = render(<App />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('プレイヤー数');
    expect(frame).toContain('Bot mode');
    expect(frame).toContain('決定');
  });
});
