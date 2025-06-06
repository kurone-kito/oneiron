export { directions, dominance, suits, phases } from './constants/entities.mjs';

export { addForbidCoordinate, moveCoordinate } from './domain/board.mjs';
export { compareCard, createDeck, dominates, shuffle } from './domain/card.mjs';
export { createGameState, nextPhase } from './domain/gameState.mjs';
export { createId } from './domain/object.mjs';
export { applyDamage, createPlayer, drawCard } from './domain/player.mjs';
export { createTeam } from './domain/team.mjs';

export type { Game } from './game.mjs';
export { createGame, stepGame } from './game.mjs';

export type { PlayerAgent } from './types/agents/player.mjs';

export type { ReadonlyRecord, RecordKey } from './types/common.mjs';

export type {
  Coordinate,
  Coordinate2D,
  Direction,
  ForbidCoordinates,
} from './types/entities/board.mjs';
export type {
  Card,
  JokerCard,
  PipCard,
  Rank,
  Suit,
} from './types/entities/card.mjs';
export type {
  Damage,
  Encounter,
  BattleResult,
} from './types/entities/encounter.mjs';
export type { GameState, Phase } from './types/entities/game.mjs';
export type {
  Id,
  Unique,
  ValueObject,
} from './types/entities/object.mjs';
export type { Player, Team } from './types/entities/player.mjs';
export type {
  LifeToken,
  NumberToken,
  Token,
} from './types/entities/token.mjs';
