import type { Deck, Element } from './card.ts';
import type { LifeToken, NumberToken } from './token.ts';

/** Element value used as a grid axis coordinate. */
export type ElementCoordinate = Element;

/** A position on the 3×3 board, identified by element on each axis. */
export type GridCoord = {
  readonly x: ElementCoordinate;
  readonly y: ElementCoordinate;
};

/** Cardinal direction a team faces on the board. */
export type Facing = 'east' | 'north' | 'south' | 'west';

/** Rotation step direction: clockwise or counter-clockwise. */
export type RotateDir = 'ccw' | 'cw';

/** Per-player state tracked within a team. */
export type PlayerState = {
  readonly life: LifeToken;
};

/** Full state for one team occupying the board. */
export type TeamState = {
  readonly position: GridCoord;
  readonly facing: Facing;
  readonly cards: Deck;
  readonly teamNumber: NumberToken;
  readonly players: readonly PlayerState[];
};

/** All teams currently standing on one grid cell. */
export type GridCell = readonly TeamState[];

/** The 3×3 board: `grid[x][y]` holds the teams at coordinate (x, y). */
export type Grid = Readonly<
  Record<ElementCoordinate, Readonly<Record<ElementCoordinate, GridCell>>>
>;

/** Ordered axis positions: fire=0, water=1, wood=2. */
export const ELEMENT_AXIS: readonly ElementCoordinate[] = [
  'fire',
  'water',
  'wood',
];

/** Clockwise facing order. */
const FACING_CW: readonly Facing[] = ['north', 'east', 'south', 'west'];

function axisDistance(a: ElementCoordinate, b: ElementCoordinate): number {
  return Math.abs(ELEMENT_AXIS.indexOf(a) - ELEMENT_AXIS.indexOf(b));
}

/** Returns true when the two grid coords refer to the same cell. */
export function isSameCoord(a: GridCoord, b: GridCoord): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Returns true when two cells share an edge.
 * Diagonal cells and cells two or more steps apart are not adjacent.
 */
export function isAdjacent(a: GridCoord, b: GridCoord): boolean {
  const dx = axisDistance(a.x, b.x);
  const dy = axisDistance(a.y, b.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
}

/** Rotates facing one step clockwise ('cw') or counter-clockwise ('ccw'). */
export function rotate(facing: Facing, dir: RotateDir): Facing {
  const i = FACING_CW.indexOf(facing);
  const offset = dir === 'cw' ? 1 : -1;
  return FACING_CW[(i + offset + 4) % 4] as Facing;
}
