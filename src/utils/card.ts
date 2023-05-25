import type { Level, Rank } from '../types/card';

/**
 * get the level of the card
 * @param rank the rank of the card
 * @returns the level of the card
 * @see {@link Level}
 * @example
 * ```ts
 * getCardLevel(1) // 0
 * ```
 */
export const getCardLevel = (rank: Rank): Level => {
  if (rank === 13) return 4;
  if (rank >= 11) return 3;
  if (rank >= 7) return 2;
  if (rank >= 3) return 1;
  return 0;
};
