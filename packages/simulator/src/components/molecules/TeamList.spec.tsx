import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
import type { Team } from '../../types.mts';
import { TeamList } from './TeamList.js';

describe('TeamList', () => {
  const teams: Team[] = [
    {
      id: 1,
      players: [
        {
          id: 'p1',
          name: 'P1',
          isBot: false,
          life: 3,
          isAlive: true,
          cards: [],
        },
      ],
      position: { x: 0, y: 0 },
      direction: 'north',
      gridCards: [],
      isEliminated: false,
    },
  ];

  it('renders team info', () => {
    const { getByText } = render(() => <TeamList teams={teams} />);
    expect(getByText('チーム1 ↑')).toBeTruthy();
    expect(getByText('P1: ❤️3')).toBeTruthy();
  });
});
