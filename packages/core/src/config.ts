/**
 * Tuning parameters for Dream Duels rule logic.
 * Concrete values for variables A–E are decided by game-design work;
 * all logic modules should accept a GameConfig rather than embedding
 * magic numbers.
 */
export type GameConfig = {
  /** (A) Number of copies of each identical card (element × value) in the deck. */
  readonly cardCopies: number;
  /** (B) Card-extraction multiplier per attribute per team when building hands. */
  readonly deckExtractFactor: number;
  /** (C) Number of random attribute cards dealt to each team at game start. */
  readonly randomCardsDealt: number;
  /** (D) Time limit for a single battle phase, in minutes. */
  readonly battleTimeLimitMin: number;
  /** (E) Card-forfeit multiplier applied when life cannot absorb full damage. */
  readonly damageOverflowFactor: number;
};

/**
 * Placeholder default configuration used until final A–E values are decided.
 * See issue #76 for the game-design decision on actual values.
 */
export const DEFAULT_CONFIG: GameConfig = {
  cardCopies: 2,
  deckExtractFactor: 2,
  randomCardsDealt: 1,
  battleTimeLimitMin: 3,
  damageOverflowFactor: 2,
} as const;
