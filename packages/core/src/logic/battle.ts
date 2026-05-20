import type { GameConfig } from '../config.ts';
import { DEFAULT_CONFIG } from '../config.ts';
import type { Card, Deck } from '../types/card.ts';
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
 * Locates the first card in `hand` matching `played` by structural
 * equality (Joker matches any joker; ElementCard matches identical
 * element and value). Returns -1 when no match exists.
 */
function findHandCardIndex(hand: Deck, played: Card): number {
  if (played.kind === 'joker') {
    return hand.findIndex((c) => c.kind === 'joker');
  }
  return hand.findIndex(
    (c) =>
      c.kind === 'element' &&
      c.element === played.element &&
      c.value === played.value,
  );
}

function describeCard(card: Card): string {
  return card.kind === 'joker' ? 'Joker' : `${card.element} ${card.value}`;
}

/**
 * Pre-resolution gate: each non-null play must reference a card
 * actually held in that team's hand. Throws RangeError with a
 * descriptive message on the first violation so the simulator
 * surfaces caller bugs immediately. Cards-not-on-grid teams also
 * throw.
 */
function validatePlays(grid: Grid, plays: readonly BattlePlay[]): void {
  for (const play of plays) {
    if (play.card === null) continue;
    const team = allTeams(grid).find((t) => t.teamNumber === play.teamId);
    if (team === undefined) {
      throw new RangeError(
        `Team ${play.teamId} not on grid; cannot play ${describeCard(play.card)}.`,
      );
    }
    if (findHandCardIndex(team.cards, play.card) === -1) {
      throw new RangeError(
        `Team ${play.teamId} cannot play ${describeCard(play.card)}: not in hand.`,
      );
    }
  }
}

/**
 * Removes the first card matching `played` from `team.cards` and
 * returns the updated team plus the removed card (which the caller
 * appends to the graveyard). When no match exists (e.g. validation
 * was bypassed), the team is returned unchanged and the played
 * card is reported as the consumed card.
 */
function consumeFromHand(
  team: TeamState,
  played: Card,
): { team: TeamState; consumed: Card } {
  const idx = findHandCardIndex(team.cards, played);
  if (idx === -1) {
    return { team, consumed: played };
  }
  const consumed = team.cards[idx] as Card;
  const cards = [...team.cards.slice(0, idx), ...team.cards.slice(idx + 1)];
  return { team: { ...team, cards }, consumed };
}

/**
 * Compute the loser's total remaining life before damage was applied.
 */
function totalLife(team: TeamState): number {
  return team.players.reduce((sum, p) => sum + p.life, 0);
}

/**
 * Per rules.ja.md §Battle 9: when a player is eliminated, the
 * winner takes one card from the loser's hand; the rest go to the
 * graveyard. When damage exceeds remaining life (overflow), the
 * winner additionally takes `E × overflow` cards (E from
 * `config.damageOverflowFactor`). v1 simplification: applies at the
 * TEAM level (one forfeit per encounter) because the engine models
 * encounters team-vs-team rather than per-player.
 *
 * The first `count` cards in `loser.cards` go to `winner.cards`;
 * any remaining loser cards go to the graveyard. Returns the
 * updated winner and the cards routed to graveyard.
 */
function applyForfeit(
  loser: TeamState,
  winner: TeamState,
  count: number,
): { winner: TeamState; toGraveyard: readonly Card[] } {
  const safeCount = Math.max(0, Math.min(count, loser.cards.length));
  const taken = loser.cards.slice(0, safeCount);
  const remaining = loser.cards.slice(safeCount);
  return {
    winner: { ...winner, cards: [...winner.cards, ...taken] },
    toGraveyard: remaining,
  };
}

/**
 * Resolves the battle phase end-to-end:
 * - Validates that every non-null play references a card the team
 *   actually holds in hand (throws RangeError otherwise).
 * - Compute encounter order via {@link orderEncounters}.
 * - For each encounter, removes the played cards from the
 *   participating teams' hands and appends them to
 *   `state.graveyard` BEFORE damage resolution.
 * - Then determines the winner via `resolveCards`, computes damage
 *   via `calcDamage` (joker/absence → fixed 1), applies damage to
 *   the loser, drops tokens at the loser's coordinate.
 * - When the damage eliminates the loser, the **winner team seizes
 *   `1 + E × overflow` cards** from the loser's remaining hand
 *   (E from `config.damageOverflowFactor`, overflow = `damage -
 *   life-before-damage`). Any loser cards not seized go to the
 *   graveyard.
 * - Eliminated teams are removed from the grid; surviving losers
 *   keep their remaining hand.
 * - Returns the updated state (refreshed `droppedLifeTokens` and
 *   `graveyard`) and the full enriched `BattleResult[]`.
 */
export function resolveBattlePhase(
  state: RoundState,
  plays: readonly BattlePlay[],
  config: GameConfig = DEFAULT_CONFIG,
): { readonly state: RoundState; readonly results: readonly BattleResult[] } {
  validatePlays(state.grid, plays);

  const encounters = orderEncounters(state);
  const playMap = new Map<TeamId, Card | null>();
  for (const play of plays) {
    playMap.set(play.teamId, play.card);
  }

  let grid = state.grid;
  let droppedLifeTokens = state.droppedLifeTokens ?? createEmptyDroppedTokens();
  let graveyard: readonly Card[] = state.graveyard ?? [];
  const results: BattleResult[] = [];

  for (const enc of encounters) {
    let teamA = findTeam(grid, enc.teamA);
    let teamB = findTeam(grid, enc.teamB);
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

    // Consume played cards from each team's hand BEFORE damage
    // resolution. Both teams retain the rest of their hand for
    // potential post-encounter operations (forfeit on elimination).
    if (cardA !== null) {
      const cons = consumeFromHand(teamA, cardA);
      teamA = cons.team;
      graveyard = [...graveyard, cons.consumed];
      grid = updateTeamInGrid(grid, teamA);
    }
    if (cardB !== null) {
      const cons = consumeFromHand(teamB, cardB);
      teamB = cons.team;
      graveyard = [...graveyard, cons.consumed];
      grid = updateTeamInGrid(grid, teamB);
    }

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

    const winnerTeam = winnerId === enc.teamA ? teamA : teamB;
    const loser = winnerId === enc.teamA ? teamB : teamA;
    const lifeBeforeDamage = totalLife(loser);
    const { team: damagedLoser, tokensDropped } = applyDamage(loser, damage);

    droppedLifeTokens = addDroppedTokens(
      droppedLifeTokens,
      loser.position,
      tokensDropped,
    );

    if (isTeamDead(damagedLoser)) {
      // Elimination forfeit: winner takes 1 base card + E × overflow.
      const overflow = Math.max(0, damage - lifeBeforeDamage);
      const forfeitCount = 1 + config.damageOverflowFactor * overflow;
      const { winner: enrichedWinner, toGraveyard } = applyForfeit(
        damagedLoser,
        winnerTeam,
        forfeitCount,
      );
      graveyard = [...graveyard, ...toGraveyard];
      grid = updateTeamInGrid(grid, enrichedWinner);
      grid = removeTeamFromGrid(grid, damagedLoser);
    } else {
      grid = updateTeamInGrid(grid, damagedLoser);
    }
  }

  return {
    state: { ...state, grid, droppedLifeTokens, graveyard },
    results,
  };
}
