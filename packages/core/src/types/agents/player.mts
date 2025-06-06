import type { Direction } from '../entities/board.mjs';
import type { Card } from '../entities/card.mjs';
import type { GameState } from '../entities/game.mjs';
import type { Player, Team } from '../entities/player.mjs';

export interface PlayerAgent {
  selectBattleCard: (
    state: GameState,
    player: Player,
  ) => Promise<Card | undefined>;
  selectMovement: (
    state: GameState,
    team: Team,
  ) => Promise<{ card: Card; direction: Direction }>;
  selectReviveAction: (
    state: GameState,
    player: Player,
  ) => Promise<'salvage' | 'chargeLife' | 'chargeCards' | undefined>;
}
