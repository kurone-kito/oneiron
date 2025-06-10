import type { CardType, Player, Team } from '../types.mjs';

/** Options for {@link updatePlayer}. */
export interface UpdatePlayerOptions {
  /** Apply damage to the player. */
  readonly damage?: boolean;
  /** Card to remove from hand. */
  readonly discard?: CardType;
}

/**
 * Select a card to use in battle.
 * - Bots prioritize jokers then the highest numbered card.
 * - Humans simply use the first card in hand.
 *
 * @param p - Player info including cards and bot flag.
 * @returns The selected card or undefined when none are available.
 */
export const selectBattleCard = (
  p: Pick<Player, 'cards' | 'isBot'>,
): CardType | undefined => {
  if (!p.cards.length) return undefined;
  if (p.isBot) {
    return p.cards.reduce((best, cur) => {
      if (cur.type === 'joker') return cur;
      if (best.type === 'joker') return best;
      return cur.number > best.number ? cur : best;
    });
  }
  return p.cards[0];
};

/**
 * Apply damage to a life value without going below zero.
 *
 * @param life - Current life value.
 * @returns Updated life value after damage.
 */
export const applyDamage = (life: number): number => Math.max(0, life - 1);

/**
 * Mark a team as eliminated if all members are out of life.
 *
 * @param team - Team to inspect.
 * @param logger - Optional logger invoked when the team loses.
 * @returns A new team object reflecting elimination state.
 */
export const checkTeamElimination = (
  team: Team,
  logger: (msg: string) => void = () => {},
): Team => {
  if (team.players.every((p) => !p.isAlive || !p.life)) {
    logger(`チーム${team.id}が敗北しました`);
    return { ...team, isEliminated: true };
  }
  return team;
};

/**
 * Create a new player instance reflecting battle effects.
 *
 * @param player - Original player.
 * @param options - Damage/discard instructions.
 * @param onDiscard - Callback invoked with discarded card.
 * @returns Updated player without mutating the original.
 */
export const updatePlayer = (
  player: Player,
  { damage = false, discard }: UpdatePlayerOptions,
  onDiscard: (card: CardType) => void = () => {},
): Player => {
  const life = damage ? applyDamage(player.life) : player.life;
  const isAlive = life > 0 && player.isAlive;
  const cards = discard
    ? player.cards.filter((c) => c !== discard)
    : player.cards;
  if (discard) onDiscard(discard);
  return { ...player, life, isAlive, cards };
};

/**
 * Replace the player at the specified index with a new instance.
 *
 * @param team - Original team.
 * @param index - Index of the player to replace.
 * @param player - New player data.
 * @returns Updated team object.
 */
export const replacePlayer = (
  team: Team,
  index: number,
  player: Player,
): Team => ({
  ...team,
  players: team.players.map((p, i) => (i === index ? player : p)),
});
