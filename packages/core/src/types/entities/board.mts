import type { IntRange } from 'type-fest';
import type { directions } from '../../constants/entities.mjs';

/** Type definition for a coordinate on the board. */
export type Coordinate = IntRange<0, 5>;

/** Type definition that the board is a 2D grid of coordinates. */
export interface Coordinate2D {
  /** The x coordinate. */
  readonly x: Coordinate;

  /** The y coordinate. */
  readonly y: Coordinate;
}

/** Type definitions for the direction of movement in the game. */
export type Direction = (typeof directions)[number];

/**
 * Type definition for a set of coordinates that are forbidden for movement.
 */
export type ForbidCoordinates = ReadonlySet<Coordinate2D>;
