/** Life token value for one player: 0 (eliminated) through 4 (full health). */
export type LifeToken = 0 | 1 | 2 | 3 | 4;

/** Number token value: uniquely identifies one of the 1–10 teams on the grid. */
export type NumberToken = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** A team is identified by its number token value. */
export type TeamId = NumberToken;

export const LIFE_MAX: LifeToken = 4;
export const LIFE_MIN: LifeToken = 0;

/** Creates a LifeToken clamped to [0, 4]. */
export function createLifeToken(n: number): LifeToken {
  return Math.min(Math.max(n, LIFE_MIN), LIFE_MAX) as LifeToken;
}

/** Returns true when the player still has life tokens remaining. */
export function isAlive(token: LifeToken): boolean {
  return token > LIFE_MIN;
}

/** Adds n life, clamped to max (default 4). */
export function chargeLife(
  token: LifeToken,
  n: number,
  max: LifeToken = LIFE_MAX,
): LifeToken {
  return Math.min(token + n, max) as LifeToken;
}

/** Subtracts n life, clamped to 0. */
export function drainLife(token: LifeToken, n: number): LifeToken {
  return Math.max(token - n, LIFE_MIN) as LifeToken;
}
