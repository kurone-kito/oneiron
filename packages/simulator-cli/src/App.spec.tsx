import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { App } from './App.js';

describe('App', () => {
  it('renders hello message', () => {
    const { lastFrame } = render(<App />);
    expect(lastFrame()).toContain('Hello, world!');
  });
});
