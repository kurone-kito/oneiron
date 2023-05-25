import type { Level, Rank } from '../types/card';
import { getCardLevel } from './card';

describe('getCardLevel', () => {
  it.each<[Rank, Level]>([
    [1, 0],
    [2, 0],
    [3, 1],
    [6, 1],
    [7, 2],
    [10, 2],
    [11, 3],
    [12, 3],
    [13, 4],
  ])('should return the correct rank: %d => %d', (level, rank) =>
    expect(getCardLevel(level)).toBe(rank)
  );
});
