import { fireEvent, render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { Toggle } from './Toggle.js';

describe('Toggle', () => {
  it('triggers onChange', async () => {
    const fn = vi.fn();
    const { getByRole } = render(() => (
      <Toggle onChange={fn} checked={false} />
    ));
    const el = getByRole('checkbox');
    await fireEvent.click(el);
    expect(fn).toHaveBeenCalled();
  });
});
