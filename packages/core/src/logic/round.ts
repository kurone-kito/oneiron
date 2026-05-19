import type { Card, Element, ElementCard } from '../types/card.ts';
import type {
  ElementCoordinate,
  Facing,
  Grid,
  GridCell,
  GridCoord,
  PlayerState,
  TeamState,
} from '../types/grid.ts';
import { ELEMENT_AXIS, isAdjacent, isSameCoord } from '../types/grid.ts';
import type { NumberToken, TeamId } from '../types/token.ts';
import { createLifeToken } from '../types/token.ts';

/** The four phases of a round, executed in order. */
export type RoundPhase = 'battle' | 'forbidden' | 'movement' | 'revival';

/**
 * Dropped life tokens awaiting revival, indexed by grid coordinate.
 * `droppedLifeTokens[x][y]` is the count of tokens lying at (x, y).
 */
export type DroppedTokens = Readonly<
  Record<ElementCoordinate, Readonly<Record<ElementCoordinate, number>>>
>;

/** Returns a zero-initialised DroppedTokens map. */
export function createEmptyDroppedTokens(): DroppedTokens {
  const row = { fire: 0, water: 0, wood: 0 } as const;
  return { fire: row, water: row, wood: row } as DroppedTokens;
}

/** Immutable snapshot of the full game state at any point in a round. */
export type RoundState = {
  readonly phase: RoundPhase;
  readonly round: number;
  readonly grid: Grid;
  /** All forbidden cells accumulated so far this game. */
  readonly forbiddenCells: readonly GridCoord[];
  /**
   * Life tokens dropped during battle (and movement penalties),
   * awaiting potential recovery in the revival phase.
   * Optional for backward compatibility with code that pre-dates
   * the wave-4 battle-damage extension.
   */
  readonly droppedLifeTokens?: DroppedTokens;
};

/**
 * Identification of a pair of teams that meet on the grid in a
 * given round, without any resolution information.
 */
export type EncounterPair = {
  readonly teamA: TeamId;
  readonly teamB: TeamId;
  readonly encounterType: 'adjacent' | 'same-cell';
};

/**
 * Full result of one encounter after card resolution and damage
 * calculation. Extends {@link EncounterPair} with the resolution
 * outcome.
 */
export type BattleResult = EncounterPair & {
  /** TeamId of the winner, or null for a draw. */
  readonly winner: TeamId | null;
  /** Damage points dealt to the loser (0 on draw). */
  readonly damage: number;
};

/** A team's movement card reveal during the movement phase. */
export type TeamMove = {
  readonly teamId: TeamId;
  /** Card revealed for movement this round. */
  readonly card: Card;
  /** Facing the team chose when presenting the card (step 3 of movement). */
  readonly intendedFacing: Facing;
};

/** Returns a blank 3×3 grid with no teams. */
export function createEmptyGrid(): Grid {
  const empty: GridCell = [];
  const row = { fire: empty, water: empty, wood: empty } as const;
  return { fire: row, water: row, wood: row } as Grid;
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

function isTeamAlive(team: TeamState): boolean {
  return team.players.some((p) => p.life > 0);
}

/**
 * Returns the list of team-pair encounters that would occur this
 * round, based purely on grid position (same cell or adjacent
 * cells). No card resolution, no damage application.
 *
 * For full battle resolution including card play, damage, and
 * dropped-token tracking, use `resolveBattlePhase` from
 * `logic/battle.ts`.
 */
export function advanceBattle(state: RoundState): EncounterPair[] {
  const teams = allTeams(state.grid);
  const results: EncounterPair[] = [];

  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const a = teams[i] as TeamState;
      const b = teams[j] as TeamState;
      if (isSameCoord(a.position, b.position)) {
        results.push({
          teamA: a.teamNumber,
          teamB: b.teamNumber,
          encounterType: 'same-cell',
        });
      } else if (isAdjacent(a.position, b.position)) {
        results.push({
          teamA: a.teamNumber,
          teamB: b.teamNumber,
          encounterType: 'adjacent',
        });
      }
    }
  }

  return results;
}

/**
 * Advances from the battle phase to movement by recording the new
 * forbidden cell. The first drawn card gives the x-coordinate and the
 * second gives the y-coordinate.
 */
export function advanceForbidden(
  state: RoundState,
  drawnCards: readonly [ElementCard, ElementCard],
): RoundState {
  const newCell: GridCoord = {
    x: drawnCards[0].element,
    y: drawnCards[1].element,
  };
  return {
    ...state,
    phase: 'movement',
    forbiddenCells: [...state.forbiddenCells, newCell],
  };
}

function elementStep(
  coord: ElementCoordinate,
  delta: 1 | -1,
): ElementCoordinate {
  const idx = ELEMENT_AXIS.indexOf(coord);
  const next = idx + delta;
  if (next < 0 || next >= ELEMENT_AXIS.length) {
    return coord;
  }
  return ELEMENT_AXIS[next] as ElementCoordinate;
}

function stepForward(pos: GridCoord, facing: Facing): GridCoord {
  switch (facing) {
    case 'north':
      return { x: pos.x, y: elementStep(pos.y, 1) };
    case 'south':
      return { x: pos.x, y: elementStep(pos.y, -1) };
    case 'east':
      return { x: elementStep(pos.x, 1), y: pos.y };
    case 'west':
      return { x: elementStep(pos.x, -1), y: pos.y };
  }
}

function replaceTeamInGrid(
  grid: Grid,
  oldPos: GridCoord,
  updated: TeamState,
): Grid {
  const oldCell = grid[oldPos.x][oldPos.y].filter(
    (t) => t.teamNumber !== updated.teamNumber,
  );
  const newPos = updated.position;
  const prevNewCell =
    oldPos.x === newPos.x && oldPos.y === newPos.y
      ? oldCell
      : grid[newPos.x][newPos.y];

  const withOldRemoved = {
    ...grid,
    [oldPos.x]: { ...grid[oldPos.x], [oldPos.y]: oldCell },
  } as Grid;

  return {
    ...withOldRemoved,
    [newPos.x]: {
      ...withOldRemoved[newPos.x],
      [newPos.y]: [...prevNewCell, updated],
    },
  } as Grid;
}

function findTeam(grid: Grid, teamId: NumberToken): TeamState | undefined {
  return allTeams(grid).find((t) => t.teamNumber === teamId);
}

function isTeamAliveTeam(team: TeamState): boolean {
  return team.players.some((p) => p.life > 0);
}

function isTeamDeadTeam(team: TeamState): boolean {
  return team.players.every((p) => p.life === 0);
}

/**
 * Removes 1 life token at a time from the lowest-life living player
 * until `damage` tokens are deducted or no living players remain.
 * Returns the updated team and the actual number of tokens removed
 * (may be less than `damage` if all players reach 0 first).
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

function removeTeamFromGrid(grid: Grid, team: TeamState): Grid {
  const { x, y } = team.position;
  const cell = grid[x][y].filter((t) => t.teamNumber !== team.teamNumber);
  return {
    ...grid,
    [x]: { ...grid[x], [y]: cell },
  } as Grid;
}

/**
 * Processes the movement phase. For each team that revealed a card:
 * - If card element matches movementAttribute (or is a joker): move
 *   the team one cell in its current facing direction (off-grid is
 *   prevented by `stepForward` which clamps to the edge).
 * - Otherwise: update the team's facing to intendedFacing.
 *
 * After all moves, applies the forbidden-cell penalty per
 * rules.ja.md §Movement 7: any team whose new position is on a
 * forbidden cell loses 1 life token (lowest-life player charged
 * first). Self-elimination via penalty removes the team from the
 * grid but does not trigger card theft.
 *
 * Returns a new state with phase = 'revival'.
 */
export function advanceMovement(
  state: RoundState,
  movementAttribute: Element,
  teamMoves: readonly TeamMove[],
): RoundState {
  let grid = state.grid;

  for (const move of teamMoves) {
    const team = findTeam(grid, move.teamId);
    if (team === undefined) continue;

    const cardElement = move.card.kind === 'element' ? move.card.element : null;
    const isMove =
      move.card.kind === 'joker' || cardElement === movementAttribute;

    let updated: TeamState;
    if (isMove) {
      const newPos = stepForward(team.position, team.facing);
      updated = { ...team, position: newPos };
    } else {
      updated = { ...team, facing: move.intendedFacing };
    }

    grid = replaceTeamInGrid(grid, team.position, updated);
  }

  // Apply forbidden-cell penalty.
  let droppedLifeTokens = state.droppedLifeTokens ?? createEmptyDroppedTokens();
  for (const team of allTeams(grid)) {
    if (!isTeamAliveTeam(team)) continue;
    const onForbidden = state.forbiddenCells.some(
      (c) => c.x === team.position.x && c.y === team.position.y,
    );
    if (!onForbidden) continue;
    const { team: damagedTeam, tokensDropped } = applyDamage(team, 1);
    droppedLifeTokens = addDroppedTokens(
      droppedLifeTokens,
      team.position,
      tokensDropped,
    );
    grid = isTeamDeadTeam(damagedTeam)
      ? removeTeamFromGrid(grid, damagedTeam)
      : replaceTeamInGrid(grid, team.position, damagedTeam);
  }

  return { ...state, phase: 'revival', grid, droppedLifeTokens };
}

/** A team's chosen recovery action when a dropped token is salvageable. */
export type RevivalAction =
  | { readonly type: 'revive-member' }
  | { readonly type: 'charge-life' }
  | { readonly type: 'charge-cards' };

const REVIVAL_LIFE_CAP = 4;

/**
 * Advances from revival to the next round's battle phase.
 *
 * For each surviving team whose current coordinate has at least one
 * dropped life token AND the team is the sole survivor on that cell
 * (v1 eligibility rule — refine via playtest if needed), apply the
 * caller-provided RevivalAction:
 *
 * - **`revive-member`**: restore one eliminated player (life 0 → 1).
 *   Bonus card draw not yet modelled (pending card-economy work).
 * - **`charge-life`**: add 1 life to the lowest-life living player,
 *   clamped to 4. Skip when no eligible player.
 * - **`charge-cards`**: no-op in v1 (deck-draw not yet modelled).
 *
 * Each consumed action decrements `droppedLifeTokens` at the team's
 * coordinate by 1. Phase advances to `'battle'` and round number
 * increments regardless of choices.
 */
export function advanceRevival(
  state: RoundState,
  choices?: ReadonlyMap<TeamId, RevivalAction>,
): RoundState {
  let grid = state.grid;
  let droppedLifeTokens = state.droppedLifeTokens ?? createEmptyDroppedTokens();

  for (const team of allTeams(grid)) {
    if (!isTeamAliveTeam(team)) continue;
    const { x, y } = team.position;
    if (droppedLifeTokens[x][y] <= 0) continue;
    // Eligibility (v1 approximation): team is the only one on the cell.
    const cohabitants = grid[x][y].filter(
      (t) => t.teamNumber !== team.teamNumber,
    );
    if (cohabitants.length > 0) continue;

    const choice = choices?.get(team.teamNumber);
    if (choice === undefined) continue;

    let updatedTeam: TeamState = team;
    let consumed = false;

    switch (choice.type) {
      case 'revive-member': {
        const idx = team.players.findIndex((p) => p.life === 0);
        if (idx === -1) break;
        const newPlayers = team.players.map((p, i) =>
          i === idx ? { life: createLifeToken(1) } : p,
        );
        updatedTeam = { ...team, players: newPlayers };
        consumed = true;
        break;
      }
      case 'charge-life': {
        let lowestIdx = -1;
        let lowestLife = Number.POSITIVE_INFINITY;
        for (let i = 0; i < team.players.length; i++) {
          const p = team.players[i] as PlayerState;
          if (p.life > 0 && p.life < REVIVAL_LIFE_CAP && p.life < lowestLife) {
            lowestLife = p.life;
            lowestIdx = i;
          }
        }
        if (lowestIdx === -1) break;
        const p = team.players[lowestIdx] as PlayerState;
        const newPlayers = team.players.map((pp, i) =>
          i === lowestIdx ? { life: createLifeToken(p.life + 1) } : pp,
        );
        updatedTeam = { ...team, players: newPlayers };
        consumed = true;
        break;
      }
      case 'charge-cards': {
        // No-op in v1: deck-draw protocol not yet modelled.
        consumed = true;
        break;
      }
    }

    if (!consumed) continue;
    droppedLifeTokens = addDroppedTokens(droppedLifeTokens, team.position, -1);
    if (updatedTeam !== team) {
      grid = replaceTeamInGrid(grid, team.position, updatedTeam);
    }
  }

  return {
    ...state,
    phase: 'battle',
    round: state.round + 1,
    grid,
    droppedLifeTokens,
  };
}

/**
 * Returns true when the game has ended: zero or one team still has at
 * least one player with life remaining.
 */
export function isGameOver(state: RoundState): boolean {
  return allTeams(state.grid).filter(isTeamAlive).length <= 1;
}

/**
 * Returns the surviving team's ID when exactly one team is still alive,
 * or null if the game is not yet over or ended in a draw.
 */
export function winner(state: RoundState): TeamId | null {
  const alive = allTeams(state.grid).filter(isTeamAlive);
  return alive.length === 1 ? (alive[0] as TeamState).teamNumber : null;
}
