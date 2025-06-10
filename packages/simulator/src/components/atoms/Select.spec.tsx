import { fireEvent, render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './Select.js';

describe('Select', () => {
  it('renders options and handles change', async () => {
    const fn = vi.fn();
    const { getByDisplayValue } = render(() => (
      <Select onChange={fn} value="a">
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>
    ));
    const el = getByDisplayValue('A');
    await fireEvent.change(el, { target: { value: 'b' } });
    expect(fn).toHaveBeenCalled();
  });
});
