import { fireEvent, render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
import { Counter } from './Counter.js';

describe('Counter', () => {
  it('increments count on click', async () => {
    const { getByRole } = render(() => <Counter />);
    const button = getByRole('button');
    expect(button.textContent).toBe('Count: 0');
    await fireEvent.click(button);
    expect(button.textContent).toBe('Count: 1');
  });
});
