import { directions } from '@kurone-kito/oneiron-core';
import type {
  Card,
  Direction,
  GameState,
  Player,
  PlayerAgent,
  Team,
} from '@kurone-kito/oneiron-core';

/**
 * Returns a random element from the given collection.
 *
 * @template T The element type.
 * @param values - The collection to pick from.
 * @param rand - The random number generator.
 * @returns The randomly selected element or `undefined` when empty.
 */
export const pickRandom = <T,>(
  values: readonly T[],
  rand: () => number,
): T | undefined =>
  values.length > 0 ? values[Math.floor(rand() * values.length)] : undefined;

/**
 * Creates a simple bot player agent which chooses random actions.
 *
 * @param rand - The random number generator. Defaults to `Math.random`.
 * @returns A {@link PlayerAgent} implementation.
 */
export const createSimpleBotAgent = (
  rand: () => number = Math.random,
): PlayerAgent => ({
  async selectBattleCard(
    _state: GameState,
    player: Player,
  ): Promise<Card | undefined> {
    return pickRandom(player.hand, rand);
  },
  async selectMovement(
    _state: GameState,
    team: Team,
  ): Promise<{ card: Card; direction: Direction }> {
    const member = team.members[0];
    const card = pickRandom(member.hand, rand);
    const direction = pickRandom(directions, rand);
    if (!card || !direction) {
      throw new Error('No valid movement action available');
    }
    return { card, direction };
  },
  async selectReviveAction(): Promise<
    'salvage' | 'chargeLife' | 'chargeCards' | undefined
  > {
    return pickRandom(
      ['salvage', 'chargeLife', 'chargeCards', undefined] as const,
      rand,
    );
  },
});
