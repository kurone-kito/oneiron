import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { BoardCell } from './BoardCell.js';

describe('BoardCell', () => {
  it('renders symbol', () => {
    const { lastFrame } = render(<BoardCell symbol="x" />);
    expect(lastFrame()).toBe('x');
  });
});
