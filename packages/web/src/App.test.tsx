import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App.tsx';

afterEach(cleanup);

describe('App', () => {
  it('routes to setup on first load and switches to the playing placeholder on submit', () => {
    render(() => <App />);

    expect(
      screen.getByRole('heading', { name: 'Dream Duels Setup' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Start game' }));

    expect(
      screen.getByRole('heading', { name: 'Game session ready' }),
    ).toBeTruthy();
    expect(screen.getByLabelText(/game grid .* phase/i)).toBeTruthy();
  });
});
