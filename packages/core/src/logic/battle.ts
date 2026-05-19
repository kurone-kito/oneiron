import type { Card } from '../types/card.ts';
import type { Grid, GridCoord, PlayerState, TeamState } from '../types/grid.ts';
import { ELEMENT_AXIS, isAdjacent, isSameCoord } from '../types/grid.ts';
import type { TeamId } from '../types/token.ts';
import { createLifeToken } from '../types/token.ts';
import { calcDamage } from './damage.ts';
import { resolveCards } from './resolve.ts';
import type {
  BattleResult,
  DroppedTokens,
  EncounterPair,
  RoundState,
} from './round.ts';
import { createEmptyDroppedTokens } from './round.ts';

/** The card a team played for this battle phase. Null = no card. */
export type BattlePlay = {
  readonly teamId: TeamId;
  readonly card: Card | null;
};

/** Joker counts as 25 for pair-sum ordering, per rules.ja.md §Battle 1. */
const JOKER_PAIR_VALUE = 25;

function cardValueForOrdering(card: Card): number {
  return card.kind === 'joker' ? JOKER_PAIR_VALUE : card.value;
}

/**
 * Pair-sum used for encounter ordering. Sums the two cards under the
 * team's number token. If `gridCards` is missing (legacy state),
 * falls back to `teamNumber * 2` to preserve deterministic order.
 */
function pairSum(team: TeamState): number {
  const cards = team.gridCards;
  if (cards === undefined) return team.teamNumber * 2;
  const [a, b] = cards;
  return cardValueForOrdering(a) + cardValueForOrdering(b);
}

function allTeams(grid: Grid): TeamState[] {
  const teams: TeamState[] = [];
  for (const x of ELEMENT_AXIS) {
    for (const y of ELEMENT_AXIS) {
      teams.push(...grid[x][y]);
    }
  }
  return teams;
}

/**
 * Orders this round's encounters per rules.ja.md §Battle 1:
 * - Same-cell pairs first, ordered by ascending pair-sum. With more
 *   than two teams on a cell, pair the lowest-sum pairs; remaining
 *   teams (odd count) are "next in line" and skip the round.
 * - Adjacent pairs collected only for teams that did not encounter
 *   in the same-cell pass.
 * - Each team participates in at most one encounter per round.
 */
export function orderEncounters(state: RoundState): readonly EncounterPair[] {
  const teams = allTeams(state.grid);
  const results: EncounterPair[] = [];
  const encountered = new Set<TeamId>();

  // Group teams by coordinate for same-cell pass.
  const byCoord = new Map<string, TeamState[]>();
  for (const team of teams) {
    const key = `${team.position.x},${team.position.y}`;
    const list = byCoord.get(key) ?? [];
    list.push(team);
    byCoord.set(key, list);
  }

  for (const list of byCoord.values()) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => {
      const ps = pairSum(a) - pairSum(b);
      if (ps !== 0) return ps;
      return a.teamNumber - b.teamNumber;
    });
    for (let i = 0; i + 1 < sorted.length; i += 2) {
      const a = sorted[i] as TeamState;
      const b = sorted[i + 1] as TeamState;
      results.push({
        teamA: a.teamNumber,
        teamB: b.teamNumber,
        encounterType: 'same-cell',
      });
      encountered.add(a.teamNumber);
      encountered.add(b.teamNumber);
    }
  }

  // Adjacent pass: only teams not yet in an encounter.
  for (let i = 0; i < teams.length; i++) {
    const a = teams[i] as TeamState;
    if (encountered.has(a.teamNumber)) continue;
    for (let j = i + 1; j < teams.length; j++) {
      const b = teams[j] as TeamState;
      if (encountered.has(b.teamNumber)) continue;
      if (isSameCoord(a.position, b.position)) continue;
      if (isAdjacent(a.position, b.position)) {
        results.push({
          teamA: a.teamNumber,
          teamB: b.teamNumber,
          encounterType: 'adjacent',
        });
        encountered.add(a.teamNumber);
        encountered.add(b.teamNumber);
        break;
      }
    }
  }

  return results;
}

function isTeamDead(team: TeamState): boolean {
  return team.players.every((p) => p.life === 0);
}

/**
 * Applies `damage` to the team by removing one life token at a time
 * from the lowest-life living player. Returns the updated team and
 * the actual number of tokens removed (may be less than `damage`
 * when all players have already reached 0).
 */
function applyDamage(
  team: TeamState,
  damage: number,
): { team: TeamState; tokensDropped: number } {
  const players: PlayerState[] = team.players.map((p) => ({ life: p.life }));
  let tokensDropped = 0;
  for (let i = 0; i < damage; i++) {
    let lowestIdx = -1;
    let lowestLife = Number.POSITIVE_INFINITY;
    for (let j = 0; j < players.length; j++) {
      const p = players[j] as PlayerState;
      if (p.life > 0 && p.life < lowestLife) {
        lowestLife = p.life;
        lowestIdx = j;
      }
    }
    if (lowestIdx === -1) break;
    const p = players[lowestIdx] as PlayerState;
    players[lowestIdx] = { life: createLifeToken(p.life - 1) };
    tokensDropped += 1;
  }
  return { team: { ...team, players }, tokensDropped };
}

function addDroppedTokens(
  tokens: DroppedTokens,
  coord: GridCoord,
  delta: number,
): DroppedTokens {
  const current = tokens[coord.x][coord.y];
  return {
    ...tokens,
    [coord.x]: { ...tokens[coord.x], [coord.y]: current + delta },
  } as DroppedTokens;
}

function findTeam(grid: Grid, teamId: TeamId): TeamState | undefined {
  return allTeams(grid).find((t) => t.teamNumber === teamId);
}

function removeTeamFromGrid(grid: Grid, team: TeamState): Grid {
  const { x, y } = team.position;
  const cell = grid[x][y].filter((t) => t.teamNumber !== team.teamNumber);
  return {
    ...grid,
    [x]: { ...grid[x], [y]: cell },
  } as Grid;
}

function updateTeamInGrid(grid: Grid, updated: TeamState): Grid {
  const { x, y } = updated.position;
  const cell = grid[x][y].map((t) =>
    t.teamNumber === updated.teamNumber ? updated : t,
  );
  return {
    ...grid,
    [x]: { ...grid[x], [y]: cell },
  } as Grid;
}

/**
 * Resolves the battle phase end-to-end:
 * - Compute encounter order via {@link orderEncounters}.
 * - For each encounter pair, take the played card (or `null` for
 *   card absence), determine the winner via `resolveCards`, compute
 *   damage via `calcDamage` (joker/absence → fixed 1), then apply
 *   damage to the loser, drop tokens at the loser's coordinate, and
 *   remove the team from the grid when all players are eliminated.
 * - Returns the updated state (with a refreshed `droppedLifeTokens`
 *   map) and the full enriched `BattleResult[]`.
 */
export function resolveBattlePhase(
  state: RoundState,
  plays: readonly BattlePlay[],
): { readonly state: RoundState; readonly results: readonly BattleResult[] } {
  const encounters = orderEncounters(state);
  const playMap = new Map<TeamId, Card | null>();
  for (const play of plays) {
    playMap.set(play.teamId, play.card);
  }

  let grid = state.grid;
  let droppedLifeTokens = state.droppedLifeTokens ?? createEmptyDroppedTokens();
  const results: BattleResult[] = [];

  for (const enc of encounters) {
    const teamA = findTeam(grid, enc.teamA);
    const teamB = findTeam(grid, enc.teamB);
    if (teamA === undefined || teamB === undefined) {
      results.push({ ...enc, winner: null, damage: 0 });
      continue;
    }

    const cardA = playMap.has(enc.teamA)
      ? (playMap.get(enc.teamA) as Card | null)
      : null;
    const cardB = playMap.has(enc.teamB)
      ? (playMap.get(enc.teamB) as Card | null)
      : null;

    let winnerId: TeamId | null = null;
    let damage = 0;

    if (cardA === null && cardB === null) {
      // Both forfeit → draw.
    } else if (cardA === null) {
      winnerId = enc.teamB;
      damage = 1;
    } else if (cardB === null) {
      winnerId = enc.teamA;
      damage = 1;
    } else {
      const outcome = resolveCards(cardA, cardB);
      if (outcome === 'a') {
        winnerId = enc.teamA;
        damage = calcDamage(teamA, teamB, cardA, cardB, {
          encounterType: enc.encounterType,
        });
      } else if (outcome === 'b') {
        winnerId = enc.teamB;
        damage = calcDamage(teamB, teamA, cardB, cardA, {
          encounterType: enc.encounterType,
        });
      }
      // outcome === 'draw' → winner null, damage 0
    }

    results.push({ ...enc, winner: winnerId, damage });

    if (winnerId === null || damage <= 0) continue;

    const loser = winnerId === enc.teamA ? teamB : teamA;
    const { team: damagedLoser, tokensDropped } = applyDamage(loser, damage);

    droppedLifeTokens = addDroppedTokens(
      droppedLifeTokens,
      loser.position,
      tokensDropped,
    );

    grid = isTeamDead(damagedLoser)
      ? removeTeamFromGrid(grid, damagedLoser)
      : updateTeamInGrid(grid, damagedLoser);
  }

  return {
    state: { ...state, grid, droppedLifeTokens },
    results,
  };
}
