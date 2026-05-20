import type { BattlePlay } from '../logic/battle.ts';
import type { RevivalAction, RoundState } from '../logic/round.ts';
import type { MovementChoice } from '../logic/runner.ts';
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

/** Returns the current team snapshot for a team id, if still on the board. */
export { findTeam, isTeamAlive } from '../logic/phase-helpers.ts';
