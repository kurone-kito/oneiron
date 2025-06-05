/** Type definition for a identifier. */
export type Id = string & Unique;

/** Type definition for a value object in the game. */
export interface ValueObject {
  /** The unique identifier of the value object. */
  readonly id: Id;
}

/** Type definition that the unique identifier for a identifier */
export interface Unique {
  /** The unique symbol for the identifier. */
  readonly __brand: unique symbol;
}
