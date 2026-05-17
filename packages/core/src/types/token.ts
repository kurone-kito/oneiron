/** Life token value for one player: 0 (eliminated) through 4 (full health). */
export type LifeToken = 0 | 1 | 2 | 3 | 4;

/** Number token value: uniquely identifies one of the 1–10 teams on the grid. */
export type NumberToken = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** A team is identified by its number token value. */
export type TeamId = NumberToken;

const LIFE_MAX: LifeToken = 4;
const LIFE_MIN: LifeToken = 0;

const isFiniteInteger = (value: number): boolean =>
  Number.isFinite(value) && Number.isInteger(value);

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const toLifeToken = (value: number): LifeToken =>
  clamp(value, LIFE_MIN, LIFE_MAX) as LifeToken;

const assertFiniteInteger = (value: number, name: string): void => {
  if (!isFiniteInteger(value)) {
    throw new RangeError(`${name} must be a finite integer.`);
  }
};

const assertNonNegativeInteger = (value: number, name: string): void => {
  assertFiniteInteger(value, name);

  if (value < 0) {
    throw new RangeError(`${name} must be a non-negative integer.`);
  }
};

const normalizeLifeMaximum = (max: number): LifeToken => {
  assertNonNegativeInteger(max, 'max');

  return toLifeToken(max);
};

/** Creates a LifeToken clamped to [0, 4]. */
export function createLifeToken(n: number): LifeToken {
  assertFiniteInteger(n, 'value');

  return toLifeToken(n);
}

/** Returns true when the player still has life tokens remaining. */
export function isAlive(token: LifeToken): boolean {
  return token > LIFE_MIN;
}

/** Adds n life, clamped to max (default 4). */
export function chargeLife(
  token: LifeToken,
  n: number,
  max: number = LIFE_MAX,
): LifeToken {
  assertNonNegativeInteger(n, 'amount');

  const upperBound = normalizeLifeMaximum(max);

  if (token > upperBound) {
    throw new RangeError('token must not exceed max.');
  }

  return toLifeToken(Math.min(token + n, upperBound));
}

/** Subtracts n life, clamped to 0. */
export function drainLife(token: LifeToken, n: number): LifeToken {
  assertNonNegativeInteger(n, 'amount');

  return toLifeToken(token - n);
}
