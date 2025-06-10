import { fireEvent, render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox.js';

describe('Checkbox', () => {
  it('triggers onChange', async () => {
    const fn = vi.fn();
    const { getByRole } = render(() => (
      <Checkbox onChange={fn} checked={false} />
    ));
    const el = getByRole('checkbox');
    await fireEvent.click(el);
    expect(fn).toHaveBeenCalled();
  });
});
