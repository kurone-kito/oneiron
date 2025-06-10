import { describe, expect, it } from 'vitest';
import type { CardType } from '../types.mjs';
import { setGridCell } from './grid.mjs';

const baseGrid = [
  [null, null],
  [null, null],
];

describe('setGridCell', () => {
  it('updates a cell without mutating the original grid', () => {
    const card: CardType = { attribute: 'fire', number: 1, type: 'attribute' };
    const updated = setGridCell(baseGrid, 1, 0, card);
    expect(updated[0]?.[1]).toEqual(card);
    // original remains unchanged
    expect(baseGrid[0]?.[1]).toBeNull();
  });
});
