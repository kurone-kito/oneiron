/** type definition of the direction */
export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * type definition of the card level
 *
 * | Level | Rank     |
 * | :---- | :------ |
 * | 0     | 1, 2    |
 * | 1     | 3 .. 6  |
 * | 2     | 7 .. 10 |
 * | 3     | 11, 12  |
 * | 4     | 13      |
 */
export type Level = 0 | 1 | 2 | 3 | 4;

/** type definition of the card rank */
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

/** type definition of the suit like the rock-paper-scissors style */
export type Suit = 'fire' | 'tree' | 'water';
