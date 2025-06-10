import { createDeck, shuffleDeck } from '../deck.mjs';
import type { CardType, GameState, Phase } from '../types.mjs';
import { applyCoordinateCards, prepareTeamsForDescent } from './descent.mjs';
import { distributeInitialCards } from './distribute.mjs';
import type { findEncounterPairs, simulateBattle } from './engine.mjs';
import { resolveEncounters } from './engine.mjs';
import { createGrid, createTeams } from './setup.mjs';

/** Type definition for phase handler function. */
export type PhaseHandler = (
  state: GameState,
  deck: CardType[],
  logger?: (msg: string) => void,
  rng?: () => number,
  options?: { onDiscard?: (card: CardType) => void },
) => PhaseResult;

/** Type definition for the result of a game phase. */
export interface PhaseResult {
  state: GameState;
  deck: CardType[];
  logs: string[];
}

/**
 * ゲームの初期化を行う。
 * @param prev - 前のゲーム状態
 * @param rng - 乱数生成関数（デフォルトはMath.random）
 * @returns 初期化後のゲーム状態、デッキ、ログ
 */
export const initializeGame = (
  prev: GameState,
  rng: () => number = Math.random,
): PhaseResult => {
  const playerCount = prev.currentPlayerCount;
  const teams = createTeams(playerCount, prev.isAutoMode);
  const teamCount = teams.length;
  const deck = shuffleDeck(createDeck(), rng);

  const state: GameState = {
    ...prev,
    phase: 'round0-prep',
    round: 0,
    teams,
    grid: createGrid(),
    forbiddenAreas: [],
  };

  const logs = [
    'ゲームを開始します！',
    `プレイヤー数: ${playerCount}, チーム数: ${teamCount}`,
  ];

  return { state, deck, logs };
};

/**
 * ラウンド0の準備を行う。
 * @param state - 現在のゲーム状態
 * @param deck - 使用するデッキ
 * @param rng - 乱数生成関数（デフォルトはMath.random）
 * @returns ラウンド0の準備後のゲーム状態、デッキ、ログ
 */
export const handleRound0Prep = (
  state: GameState,
  deck: CardType[],
  rng: () => number = Math.random,
): PhaseResult => {
  const { teams, deck: nextDeck } = distributeInitialCards(
    state.teams,
    deck,
    rng,
  );
  const newState: GameState = { ...state, teams, phase: 'round0-descent' };
  return {
    state: newState,
    deck: nextDeck,
    logs: ['各チームに初期カードを配布しました'],
  };
};

/**
 * ラウンド0の降下を行う。
 * @param state - 現在のゲーム状態
 * @param deck - 使用するデッキ
 * @returns ラウンド0の降下後のゲーム状態、デッキ、ログ
 */
export const handleRound0Descent = (
  state: GameState,
  deck: CardType[],
  rng: () => number = Math.random,
): PhaseResult => {
  const withAxis = applyCoordinateCards(state.grid, rng);
  const { teams, grid } = prepareTeamsForDescent(state.teams, withAxis, rng);
  const newState: GameState = {
    ...state,
    teams,
    grid,
    phase: 'battle',
    round: 1,
  };
  return {
    state: newState,
    deck,
    logs: ['各チームが戦場に降下しました！ラウンド1開始'],
  };
};

/**
 * バトルフェーズを実行する。
 * @param state - 現在のゲーム状態
 * @param deck - 使用するデッキ
 * @param logger - ログ出力関数（デフォルトは何もしない）
 * @param options - オプション設定
 * @returns バトルフェーズ後のゲーム状態、デッキ、ログ
 */
export const handleBattlePhase = (
  state: GameState,
  deck: CardType[],
  logger: (msg: string) => void = () => {},
  options: {
    findPairs?: typeof findEncounterPairs;
    simulate?: typeof simulateBattle;
    onDiscard?: (card: CardType) => void;
  } = {},
): PhaseResult => {
  const { teams, logs } = resolveEncounters(state.teams, logger, options);
  const survivors = teams.filter((t) => !t.isEliminated);
  if (survivors.length <= 1) {
    logs.push(
      survivors.length === 1
        ? `チーム${survivors[0]?.id}の勝利！`
        : '引き分け！',
    );
  }
  const nextPhase = survivors.length <= 1 ? 'finished' : 'forbidden';
  const newState: GameState = { ...state, teams, phase: nextPhase };
  return { state: newState, deck, logs };
};

/**
 * Mapping table from phase id to handler implementation.
 *
 * Only game phases that appear after setup are included.
 */
export const phaseHandlers: Record<Exclude<Phase, 'setup'>, PhaseHandler> = {
  'round0-prep': (state, deck, _logger, rng = Math.random) =>
    handleRound0Prep(state, deck, rng),
  'round0-descent': (state, deck, _logger, rng = Math.random) =>
    handleRound0Descent(state, deck, rng),
  battle: (
    state,
    deck,
    logger: (msg: string) => void = () => {},
    _rng: () => number = Math.random,
    options: { onDiscard?: (card: CardType) => void } = {},
  ) => handleBattlePhase(state, deck, logger, options),
  forbidden: (state, deck) => ({
    state: { ...state, phase: 'movement' },
    deck,
    logs: ['禁止エリアフェーズをスキップしました'],
  }),
  movement: (state, deck) => ({
    state: { ...state, phase: 'revival' },
    deck,
    logs: ['移動フェーズをスキップしました'],
  }),
  revival: (state, deck) => ({
    state: { ...state, phase: 'battle', round: state.round + 1 },
    deck,
    logs: [`ラウンド${state.round + 1}開始`],
  }),
  finished: (state, deck) => ({ state, deck, logs: [] }),
};

/**
 * 現在のフェーズを進める。
 * @param state - 現在のゲーム状態
 * @param deck - 使用するデッキ
 * @param logger - ログ出力関数（デフォルトは何もしない）
 * @param rng - 乱数生成関数（デフォルトはMath.random）
 * @returns 次のフェーズのゲーム状態、デッキ、ログ
 */
export const nextPhase = (
  state: GameState,
  deck: CardType[],
  logger: (msg: string) => void = () => {},
  rng: () => number = Math.random,
  options: { onDiscard?: (card: CardType) => void } = {},
): PhaseResult => {
  const phase = state.phase as Exclude<Phase, 'setup'>;
  const handler = phaseHandlers[phase];
  return handler(state, deck, logger, rng, options);
};
