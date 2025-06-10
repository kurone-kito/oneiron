import type { Direction } from '../types.mjs';

/** Mapping table of direction to rotation angle. */
export const directionAngles = {
  north: 0,
  east: 90,
  south: 180,
  west: 270,
} as const satisfies Record<Direction, number>;

/**
 * Convert a direction to a rotation angle in degrees.
 *
 * @param d - The direction.
 * @returns Angle in degrees.
 */
export const getDirectionAngle = (d?: Direction): number =>
  d ? directionAngles[d] : 0;
