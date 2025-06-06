import type {
  Coordinate,
  Coordinate2D,
  Direction,
  ForbidCoordinates,
} from '../types/entities/board.mjs';

/**
 * Returns a new set that contains the given coordinate in addition to the
 * existing forbidden coordinates.
 * @param forbids The existing set of forbidden coordinates.
 * @param value The coordinate to add to the set of forbidden coordinates.
 * @returns A new set containing the existing forbidden coordinates and the
 * new coordinate.
 */
export const addForbidCoordinate = (
  forbids: ForbidCoordinates,
  value: Coordinate2D,
): ForbidCoordinates => new Set([...Array.from(forbids), value]);

/**
 * Applies damage to a player, reducing their life by the damage value,
 * @param value The player to apply damage to.
 * @param min The minimum value to clamp to.
 * @param max The maximum value to clamp to.
 * @returns The player's life after applying damage, ensuring it does not
 * go below zero.
 */
const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/**
 * Maps directions to their respective coordinate deltas.
 *
 * Each direction corresponds to a change in the x and y coordinates.
 */
const deltaMap = {
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
} as const satisfies Record<Direction, { x: number; y: number }>;

/**
 * Moves the coordinate in the specified direction while keeping it within
 * the 5x5 board.
 * @param coord The coordinate to move.
 * @param direction The direction to move the coordinate.
 * @returns A new coordinate that is moved in the specified direction,
 * clamped to the bounds of the board.
 */
export const moveCoordinate = (
  coord: Coordinate2D,
  direction: Direction,
): Coordinate2D => ({
  x: clamp(coord.x + deltaMap[direction].x, 0, 4) as Coordinate,
  y: clamp(coord.y + deltaMap[direction].y, 0, 4) as Coordinate,
});
