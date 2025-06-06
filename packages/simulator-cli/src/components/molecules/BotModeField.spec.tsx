import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { BotModeField } from './BotModeField.js';

describe('BotModeField', () => {
  it('shows bot mode checkbox', () => {
    const { lastFrame } = render(<BotModeField />);
    expect(lastFrame()).toContain('[x] Bot mode');
  });
});
