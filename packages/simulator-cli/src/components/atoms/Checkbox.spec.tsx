import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { Checkbox } from './Checkbox.js';

describe('Checkbox', () => {
  it('renders checked box', () => {
    const { lastFrame } = render(<Checkbox label="Item" checked />);
    expect(lastFrame()).toContain('[x] Item');
  });

  it('renders unchecked box', () => {
    const { lastFrame } = render(<Checkbox label="Item" checked={false} />);
    expect(lastFrame()).toContain('[ ] Item');
  });
});
