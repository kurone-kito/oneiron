import type { Card } from '@kurone-kito/oneiron-core';
import { cleanup, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it } from 'vitest';
import { Hand } from './Hand.tsx';

afterEach(cleanup);

const fireCard: Card = { kind: 'element', element: 'fire', value: 5 };
const waterCard: Card = { kind: 'element', element: 'water', value: 3 };
const joker: Card = { kind: 'joker' };

describe('Hand', () => {
  it('renders player label', () => {
    render(() => <Hand cards={[fireCard]} label="Player 1" faceUp={true} />);
    expect(screen.getByText('Player 1')).toBeTruthy();
  });

  it('shows element symbol and value when faceUp is true', () => {
    render(() => <Hand cards={[fireCard]} label="P1" faceUp={true} />);
    expect(screen.getByLabelText('fire 5')).toBeTruthy();
  });

  it('hides card content when faceUp is false', () => {
    render(() => <Hand cards={[fireCard]} label="P1" faceUp={false} />);
    expect(screen.getByLabelText('Card face down')).toBeTruthy();
    expect(screen.queryByLabelText('fire 5')).toBeNull();
  });

  it('renders joker card with distinct display', () => {
    render(() => <Hand cards={[joker]} label="P1" faceUp={true} />);
    expect(screen.getByLabelText('Joker')).toBeTruthy();
  });

  it('renders multiple cards', () => {
    render(() => (
      <Hand cards={[fireCard, waterCard, joker]} label="P1" faceUp={true} />
    ));
    expect(screen.getByLabelText('fire 5')).toBeTruthy();
    expect(screen.getByLabelText('water 3')).toBeTruthy();
    expect(screen.getByLabelText('Joker')).toBeTruthy();
  });
});
