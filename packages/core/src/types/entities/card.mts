import type { IntRange } from 'type-fest';
import type { suits } from '../../constants/entities.mjs';
import type { ValueObject } from './object.mjs';

/** Type definition for an any card in the game.  */
export type Card = JokerCard | PipCard;

/** Type definition for a joker card in the game. */
export interface JokerCard extends ValueObject {
  /** The card type */
  readonly type: 'joker';
}

/** Type definition for an pip card in the game. */
export interface PipCard extends ValueObject {
  /** The rank of the card */
  readonly rank: Rank;

  /** The suit of the card */
  readonly suit: Suit;

  /** The card type */
  readonly type: 'pip';
}

/** Type definitions for card ranks in the game. */
export type Rank = IntRange<1, 14>;

/** Type definitions for card entities in the game. */
export type Suit = (typeof suits)[number];
