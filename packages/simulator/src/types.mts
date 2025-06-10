export type Attribute = 'fire' | 'water' | 'wood';
export type Direction = 'north' | 'south' | 'east' | 'west';

export interface AttributeCard {
  attribute: Attribute;
  number: number;
  type: 'attribute';
}

export interface JokerCard {
  type: 'joker';
}

export type CardType = AttributeCard | JokerCard;

export type Position = { readonly x: number; readonly y: number };

export interface Player {
  readonly id: string;
  readonly name: string;
  readonly isBot: boolean;
  readonly life: number;
  readonly isAlive: boolean;
  readonly cards: readonly CardType[];
}

export type Phase =
  | 'setup'
  | 'round0-prep'
  | 'round0-descent'
  | 'battle'
  | 'forbidden'
  | 'movement'
  | 'revival'
  | 'finished';

export interface Team {
  readonly direction: Direction;
  readonly gridCards: readonly CardType[];
  readonly id: number;
  readonly isEliminated: boolean;
  readonly players: readonly Player[];
  readonly position: Position;
}

export interface GameState {
  readonly currentPlayerCount: number;
  readonly forbiddenAreas: readonly Position[];
  readonly grid: readonly (CardType | null)[][];
  readonly isAutoMode: boolean;
  readonly isPlaying: boolean;
  readonly phase: Phase;
  readonly round: number;
  readonly teams: readonly Team[];
}
