import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
import { PlayerStatus } from './PlayerStatus.js';

describe('PlayerStatus', () => {
  const player = {
    name: 'Tester',
    life: 3,
    isAlive: true,
    isBot: false,
    id: 'p1',
    cards: [
      { attribute: 'fire', number: 1, type: 'attribute' },
      { attribute: 'water', number: 1, type: 'attribute' },
      { type: 'joker' },
    ],
  } as const;

  it('displays player name and life', () => {
    const { getByText } = render(() => <PlayerStatus player={player} />);
    expect(getByText('Tester: ❤️3')).toBeTruthy();
  });
});
