import type { ValueObject } from './object.mjs';

/** Type definition for a life token in the game. */
export interface LifeToken extends ValueObject {
  /** The token type */
  readonly type: 'life';
}

/** Type definition for a number token in the game. */
export interface NumberToken extends ValueObject {
  /** The token type */
  readonly type: 'number';

  /** The token value */
  readonly value: number;
}

/** Type definitions for any token entities in the game. */
export type Token = LifeToken | NumberToken;
