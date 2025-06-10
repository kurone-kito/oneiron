import type { Attribute, Direction } from './types.mjs';

export const ATTRIBUTES = [
  'fire',
  'water',
  'wood',
] as const satisfies readonly Attribute[];

export const DIRECTIONS = [
  'north',
  'south',
  'east',
  'west',
] as const satisfies readonly Direction[];

// ----- Game variables defined in README ------------------------------------

/** Duplicate count for each attribute card (variable A). */
export const CARD_DUPLICATION = 4;

/** Multiplier for drawing attribute cards when setting up (variable B). */
export const ATTRIBUTE_EXTRACTION_MULTIPLIER = 2;

/** Number of random cards distributed to each team (variable C). */
export const INITIAL_RANDOM_CARD_COUNT = 2;

/**
 * Multiplier of cards stolen when life tokens are insufficient (variable D).
 */
export const CARD_STEAL_MULTIPLIER = 1;

/** Cards given to a revived member (variable E). */
export const REVIVE_GIVE_CARDS = 2;

/** Cards drawn when charging during revival (variable F). */
export const REVIVE_CHARGE_CARDS = 5;

/** Minimum allowed player count. */
export const MIN_PLAYER_COUNT = 2;

/** Maximum allowed player count. */
export const MAX_PLAYER_COUNT = 12;

/** Default player count used by the simulator. */
export const DEFAULT_PLAYER_COUNT = 6;

/** Size of one side of the game grid. */
export const GRID_SIZE = 5;
