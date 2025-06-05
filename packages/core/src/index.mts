export { directions, dominance, suits, phases } from './constants/entities.mjs';

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
