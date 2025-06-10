import { fireEvent, render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button.js';

describe('Button', () => {
  it('triggers onClick', async () => {
    const fn = vi.fn();
    const { getByText } = render(() => <Button onClick={fn}>OK</Button>);
    const el = getByText('OK');
    await fireEvent.click(el);
    expect(fn).toHaveBeenCalled();
  });
});
