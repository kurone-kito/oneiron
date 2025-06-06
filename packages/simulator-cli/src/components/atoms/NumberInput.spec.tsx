import { render } from 'ink-testing-library';
import { describe, expect, it, vi } from 'vitest';
import { NumberInput } from './NumberInput.js';

describe('NumberInput', () => {
  it('displays given value', () => {
    const { lastFrame } = render(
      <NumberInput value="42" onChange={() => {}} onSubmit={() => {}} />,
    );
    expect(lastFrame()).toContain('42');
  });

  it('calls onSubmit when Enter is pressed', () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <NumberInput value="" onChange={() => {}} onSubmit={onSubmit} />,
    );
    stdin.write('\r');
    expect(onSubmit).toHaveBeenCalled();
  });
});
