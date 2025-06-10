import type { Phase } from '../types.mjs';

/**
 * オートモードでフェーズを自動的に進めるかどうかを判断する。
 * @param phase - 現在のフェーズ
 * @param auto - オートモードかどうか
 * @returns 自動的に進めるべきかどうか
 */
export const shouldAutoAdvance = (
  phase: Phase,
  auto: boolean,
  playing: boolean,
) => playing && auto && phase !== 'setup' && phase !== 'finished';
