import { createSignal } from 'solid-js';
import { type SetStoreFunction, createStore } from 'solid-js/store';
import { DEFAULT_PLAYER_COUNT, GRID_SIZE } from '../constants.mjs';
import type { CardType, GameState } from '../types.mjs';
import { createLogStore } from './logStore.mjs';
import {
  initializeGame as initializeGameLogic,
  nextPhase as nextPhaseLogic,
} from './phases.mjs';

/**
 * Create the initial game state.
 *
 * @param playerCount - Starting number of players.
 * @returns Fresh {@link GameState}.
 */
export const createInitialState = (
  playerCount = DEFAULT_PLAYER_COUNT,
): GameState => ({
  phase: 'setup',
  round: 0,
  teams: [],
  grid: Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null)),
  forbiddenAreas: [],
  currentPlayerCount: playerCount,
  isAutoMode: true,
  isPlaying: true,
});

/** Type definition that the controller API exposed to components. */
export interface GameController {
  addLog: (msg: string) => void;
  deck: () => CardType[];
  graveyard: () => CardType[];
  initializeGame: () => void;
  log: () => string[];
  nextPhase: () => void;
  setDeck: (cards: CardType[]) => void;
  setGraveyard: (cards: CardType[]) => void;
  setState: SetStoreFunction<GameState>;
  state: GameState;
}

/**
 * Instantiate a reactive game controller managing state and deck.
 *
 * @param initial - Initial game state.
 * @returns Controller instance.
 */
export const createGameController = (
  initial: GameState = createInitialState(),
): GameController => {
  const [state, setState] = createStore<GameState>(initial);
  const [deck, setDeck] = createSignal<CardType[]>([]);
  const [graveyard, setGraveyard] = createSignal<CardType[]>([]);
  const [log, addLog] = createLogStore();

  const initializeGame = () => {
    const { state: next, deck: nextDeck, logs } = initializeGameLogic(state);
    setState(next);
    setDeck(nextDeck);
    setGraveyard([]);
    logs.forEach(addLog);
  };

  const nextPhase = () => {
    const used: CardType[] = [];
    const {
      state: next,
      deck: nextDeck,
      logs,
    } = nextPhaseLogic(state, deck(), addLog, Math.random, {
      onDiscard: (c) => used.push(c),
    });
    setState(next);
    setDeck(nextDeck);
    if (used.length) setGraveyard((prev) => [...prev, ...used]);
    logs.forEach(addLog);
  };

  return {
    get state() {
      return state;
    },
    setState,
    deck,
    setDeck,
    graveyard,
    setGraveyard,
    log,
    initializeGame,
    nextPhase,
    addLog,
  };
};
