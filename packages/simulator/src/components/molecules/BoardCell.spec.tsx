import { render } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';
import type { Direction } from '../../types.mjs';
import { getDirectionAngle } from '../../utils/direction.mjs';
import { BoardCell } from './BoardCell.js';

describe('BoardCell utilities', () => {
  it('returns angle for each direction', () => {
    const dirs: Direction[] = ['north', 'east', 'south', 'west'];
    const angles = dirs.map(getDirectionAngle);
    expect(angles).toEqual([0, 90, 180, 270]);
  });
});

describe('BoardCell', () => {
  it('shows card', () => {
    const card = { attribute: 'fire', number: 1, type: 'attribute' } as const;
    const { getByTestId } = render(() => (
      <BoardCell
        card={card}
        team={{ id: 1, direction: 'north', gridCards: [card] }}
      />
    ));
    expect(getByTestId('grid-cell')).toBeTruthy();
  });
});
