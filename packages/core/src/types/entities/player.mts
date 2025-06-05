import type { Coordinate2D, Direction } from './board.mjs';
import type { Card } from './card.mjs';
import type { ValueObject } from './object.mjs';
import type { NumberToken } from './token.mjs';

/** Type definition for a player in the game. */
export interface Player extends ValueObject {
  /** The player's hand of cards */
  readonly hand: readonly Card[];

  /** The player's remaining life */
  readonly life: number;
}

/** Type definition for a team in the game. */
export interface Team extends ValueObject {
  /** The team's coordinate on the board */
  readonly coordinate: Coordinate2D;

  /** The team's direction */
  readonly direction: Direction;

  /** The team's members */
  readonly members: readonly [Player, Player] | readonly [Player];

  /** The team's token */
  readonly token: NumberToken;
}
