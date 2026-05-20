import { createRng } from '../logic/deck.ts';
import type { RevivalAction, RoundState } from '../logic/round.ts';
import type { Facing } from '../types/grid.ts';
import type { TeamId } from '../types/token.ts';
import {
  findTeam,
  isTeamAlive,
  type StrategyMovementChoice,
  type TeamStrategy,
} from './strategy.ts';

const FACINGS: readonly Facing[] = ['north', 'east', 'south', 'west'];
const BATTLE_FORFEIT_PROBABILITY = 0.1;

function pickOne<T>(items: readonly T[], rng: () => number): T {
  const index = Math.floor(rng() * items.length);
  return items[index] as T;
}

function randomFacing(rng: () => number): Facing {
  return pickOne(FACINGS, rng);
}

function randomGridSwapIndex(rng: () => number): 0 | 1 {
  return rng() < 0.5 ? 0 : 1;
}

function randomMovementChoice(
  state: RoundState,
  teamId: TeamId,
  rng: () => number,
): StrategyMovementChoice | null {
  const team = findTeam(state, teamId);
  if (team === undefined || !isTeamAlive(team)) return null;

  if (team.cards.length === 0) {
    return {
      kind: 'emergency-draw',
      intendedFacing: randomFacing(rng),
      gridSwapIndex: randomGridSwapIndex(rng),
      emergencyDrawPick: randomGridSwapIndex(rng),
    };
  }

  return {
    kind: 'explicit',
    card: pickOne(team.cards, rng),
    intendedFacing: randomFacing(rng),
    gridSwapIndex: randomGridSwapIndex(rng),
  };
}

function revivalOptions(state: RoundState, teamId: TeamId): RevivalAction[] {
  const team = findTeam(state, teamId);
  if (team === undefined || !isTeamAlive(team)) return [];

  const dropped =
    state.droppedLifeTokens?.[team.position.x]?.[team.position.y] ?? 0;
  if (dropped <= 0) return [];
  const cohabitants = state.grid[team.position.x][team.position.y].filter(
    (other) => other.teamNumber !== team.teamNumber,
  );
  if (cohabitants.length > 0) return [];

  const options: RevivalAction[] = [{ type: 'charge-cards' }];
  if (team.players.some((player) => player.life === 0)) {
    options.push({ type: 'revive-member' });
  }
  if (team.players.some((player) => player.life > 0 && player.life < 4)) {
    options.push({ type: 'charge-life' });
  }
  return options;
}

/**
 * Creates a strategy that picks reproducible pseudo-random legal choices.
 */
export function randomStrategy(seed: number): TeamStrategy {
  const rng = createRng(seed);

  return {
    chooseBattlePlay(state, teamId) {
      const team = findTeam(state, teamId);
      if (team === undefined || !isTeamAlive(team) || team.cards.length === 0) {
        return { card: null };
      }
      if (rng() < BATTLE_FORFEIT_PROBABILITY) {
        return { card: null };
      }
      return { card: pickOne(team.cards, rng) };
    },
    chooseTeamMove(state, teamId) {
      return randomMovementChoice(state, teamId, rng);
    },
    chooseRevivalAction(state, teamId) {
      const options = revivalOptions(state, teamId);
      if (options.length === 0) return null;

      const maybeSkip = [...options, null] as const;
      return pickOne(maybeSkip, rng);
    },
  };
}
