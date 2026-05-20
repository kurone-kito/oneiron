import type { BattlePlay } from '../logic/battle.ts';
import type { RevivalAction, RoundState } from '../logic/round.ts';
import type { MovementChoice } from '../logic/runner.ts';
import { ELEMENT_AXIS, type TeamState } from '../types/grid.ts';
import type { TeamId } from '../types/token.ts';

type ExplicitStrategyMovementChoice = Omit<
  Extract<MovementChoice, { readonly kind: 'explicit' }>,
  'teamId'
>;

type EmergencyDrawStrategyMovementChoice = Omit<
  Extract<MovementChoice, { readonly kind: 'emergency-draw' }>,
  'teamId'
>;

export type StrategyBattleChoice = Pick<BattlePlay, 'card'>;

export type StrategyMovementChoice =
  | ExplicitStrategyMovementChoice
  | EmergencyDrawStrategyMovementChoice;

/** Strategy callbacks for one team. */
export type TeamStrategy = {
  readonly chooseBattlePlay: (
    state: RoundState,
    teamId: TeamId,
  ) => StrategyBattleChoice;
  readonly chooseTeamMove: (
    state: RoundState,
    teamId: TeamId,
  ) => StrategyMovementChoice | null;
  readonly chooseRevivalAction: (
    state: RoundState,
    teamId: TeamId,
  ) => RevivalAction | null;
};

function allTeams(state: RoundState): TeamState[] {
  const teams: TeamState[] = [];
  for (const x of ELEMENT_AXIS) {
    for (const y of ELEMENT_AXIS) {
      teams.push(...state.grid[x][y]);
    }
  }
  return teams;
}

/** Returns the current team snapshot for a team id, if still on the board. */
export function findTeam(
  state: RoundState,
  teamId: TeamId,
): TeamState | undefined {
  return allTeams(state).find((team) => team.teamNumber === teamId);
}

/** Returns true when the team still has at least one living player. */
export function isTeamAlive(team: TeamState): boolean {
  return team.players.some((player) => player.life > 0);
}
