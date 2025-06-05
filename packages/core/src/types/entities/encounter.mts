import type { Team } from './player.mjs';

/** Type definition for a damage in the game. */
export interface Damage {
  /** The value of the damage */
  readonly value: number;
}

/** Type definition for an encounter in the game. */
export interface Encounter {
  /** The damage dealt in the encounter */
  readonly attacker: Team;

  /** The damage received in the encounter */
  readonly defender: Team;
}

/** Type definition for the result of a battle between two teams. */
export interface BattleResult {
  /** The team that won the battle */
  readonly winner: Team;

  /** The team that lost the battle */
  readonly loser: Team;

  /** The damage dealt by the winner */
  readonly damage: Damage;
}
