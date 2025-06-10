import { GRID_SIZE } from '../constants.mjs';
import type { CardType, Player, Team } from '../types.mjs';
import { calculateTeamCount, createPlayer, createTeam } from './factory.mjs';

/**
 * 盤面の初期グリッドを生成する。
 * @param size - 一辺の長さ。
 * @returns グリッド。
 */
export const createGrid = (size = GRID_SIZE): (CardType | null)[][] =>
  Array.from({ length: size }, () => Array.from({ length: size }, () => null));

/**
 * プレイヤー数からチームを作成する。
 * @param playerCount - 参加プレイヤー数。
 * @param isAutoMode - オートモードかどうか。
 * @returns チーム配列。
 */
export const createTeams = (playerCount: number, isAutoMode = true): Team[] => {
  const teamCount = calculateTeamCount(playerCount);
  const createPlayers = (startId: number, count: number): Player[] =>
    Array.from({ length: count }, (_, i) => {
      const id = startId + i;
      return createPlayer(id, !(isAutoMode || id), !id, count);
    });
  return Array.from({ length: teamCount }, (_, teamIndex) => {
    const isLast = teamIndex === teamCount - 1;
    const playersInTeam = isLast && playerCount % 2 === 1 ? 1 : 2;
    const startId = teamIndex * 2;
    return createTeam(teamIndex + 1, createPlayers(startId, playersInTeam));
  });
};
