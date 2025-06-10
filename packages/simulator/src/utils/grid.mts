import type { CardType } from '../types.mjs';

/**
 * Replace a cell in the grid immutably.
 *
 * @param grid - Original grid.
 * @param x - X coordinate.
 * @param y - Y coordinate.
 * @param card - Card to place in the cell.
 * @returns New grid with the updated cell.
 */
export const setGridCell = (
  grid: readonly (CardType | null)[][],
  x: number,
  y: number,
  card: CardType | null,
): (CardType | null)[][] =>
  grid.map((row, rowIdx) =>
    rowIdx === y ? row.map((c, colIdx) => (colIdx === x ? card : c)) : [...row],
  );
