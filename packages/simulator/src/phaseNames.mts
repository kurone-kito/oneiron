/** Mapping of game phase identifiers to display names. */
export const phaseNameMap = {
  setup: 'セットアップ',
  'round0-prep': '事前準備',
  'round0-descent': '降下',
  battle: 'バトル',
  forbidden: '禁止エリア',
  movement: '移動',
  revival: '復活',
  finished: '終了',
} as const;

export type PhaseNameMap = typeof phaseNameMap;

/**
 * Get the display name for a game phase.
 * @param phase - Phase identifier.
 * @returns Localized name of the phase.
 */
export const getPhaseName = <T extends keyof PhaseNameMap>(
  phase: T,
): PhaseNameMap[T] => phaseNameMap[phase];
