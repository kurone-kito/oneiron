import type { Card } from '../types/entities/card.mjs';
import type { Damage } from '../types/entities/encounter.mjs';
import type { Id } from '../types/entities/object.mjs';
import type { Player } from '../types/entities/player.mjs';
import { createId } from './object.mjs';

/**
 * Applies damage to a player without mutating the original.
 * @param player The player to apply damage to.
 * @param damage The damage to apply.
 * @returns A new player object with updated life.
 * If the damage reduces life below zero, it sets life to zero.
 */
export const applyDamage = (player: Player, damage: Damage): Player => ({
  ...player,
  life: Math.max(0, player.life - damage.value),
});

/**
 * Creates a new player.
 * @param life The initial life of the player, default is 4.
 * @param hand The initial hand of the player, default is an empty array.
 * @param id The unique identifier for the player, default is a newly
 * created ID.
 * @returns A new player object.
 */
export const createPlayer = (
  life = 4,
  hand: readonly Card[] = [],
  id: Id = createId(),
): Player => ({ id, life, hand });

/**
 * Adds a card to a player's hand and returns the updated player.
 * @param player The player to update.
 * @param card The card to add to the player's hand.
 * @returns A new player object with the card added to the hand.
 */
export const drawCard = (player: Player, card: Card): Player => ({
  ...player,
  hand: [...player.hand, card],
});
