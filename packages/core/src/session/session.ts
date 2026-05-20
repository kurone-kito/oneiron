import { DEFAULT_CONFIG, type GameConfig } from '../config.ts';
import type { BattlePlay } from '../logic/battle.ts';
import { resolveBattlePhase } from '../logic/battle.ts';
import {
  allTeams,
  coerceToElementCard,
  drawFromDeck,
  findTeam,
  isTeamAlive,
  type MovementChoice,
  resolveMovementChoices,
  updateTeam,
} from '../logic/phase-helpers.ts';
import {
  advanceForbidden,
  advanceMovement,
  advanceRevival,
  isGameOver,
  type RevivalAction,
  type RoundState,
  type TeamMove,
} from '../logic/round.ts';
import type { TeamStrategy } from '../strategy/strategy.ts';
import type { Card, Element } from '../types/card.ts';
import type { TeamState } from '../types/grid.ts';
import type { TeamId } from '../types/token.ts';

export type TeamControl =
  | { readonly type: 'human' }
  | { readonly type: 'bot'; readonly strategy: TeamStrategy };

export type SessionConfig = {
  readonly controls: ReadonlyMap<TeamId, TeamControl>;
  readonly gameConfig?: GameConfig;
};

export type HumanInputRequest =
  | { readonly phase: 'battle'; readonly humanTeams: readonly TeamId[] }
  | {
      readonly phase: 'movement';
      readonly humanTeams: readonly TeamId[];
      readonly movementAttribute: Element;
    }
  | { readonly phase: 'revival'; readonly humanTeams: readonly TeamId[] };

export type HumanInputs = {
  readonly battlePlays?: ReadonlyMap<TeamId, BattlePlay>;
  readonly teamMoves?: ReadonlyMap<TeamId, TeamMove>;
  readonly revivalActions?: ReadonlyMap<TeamId, RevivalAction>;
};

export type SessionStep =
  | {
      readonly status: 'awaiting';
      readonly request: HumanInputRequest;
      readonly state: RoundState;
    }
  | { readonly status: 'done'; readonly state: RoundState };

const DEFAULT_HUMAN_CONTROL: TeamControl = { type: 'human' };

function controlFor(
  controls: ReadonlyMap<TeamId, TeamControl>,
  teamId: TeamId,
): TeamControl {
  return controls.get(teamId) ?? DEFAULT_HUMAN_CONTROL;
}

function sortedLivingTeams(
  state: RoundState,
  controls: ReadonlyMap<TeamId, TeamControl>,
  type: TeamControl['type'],
): TeamState[] {
  return allTeams(state)
    .filter((team) => isTeamAlive(team))
    .filter((team) => controlFor(controls, team.teamNumber).type === type)
    .sort((left, right) => left.teamNumber - right.teamNumber);
}

function humanBattleTeams(
  state: RoundState,
  controls: ReadonlyMap<TeamId, TeamControl>,
): readonly TeamId[] {
  return sortedLivingTeams(state, controls, 'human').map(
    (team) => team.teamNumber,
  );
}

function eligibleRevivalHumanTeams(
  state: RoundState,
  controls: ReadonlyMap<TeamId, TeamControl>,
): readonly TeamId[] {
  return sortedLivingTeams(state, controls, 'human')
    .filter((team) => {
      const dropped =
        state.droppedLifeTokens?.[team.position.x]?.[team.position.y] ?? 0;
      if (dropped <= 0) return false;
      const cohabitants = state.grid[team.position.x][team.position.y].filter(
        (other) => other.teamNumber !== team.teamNumber,
      );
      return cohabitants.length === 0;
    })
    .map((team) => team.teamNumber);
}

function hasCompleteInputs<T>(
  teamIds: readonly TeamId[],
  values: ReadonlyMap<TeamId, T> | undefined,
): boolean {
  if (teamIds.length === 0) {
    return true;
  }
  return values !== undefined && teamIds.every((teamId) => values.has(teamId));
}

function primeHumanMovementHands(
  state: RoundState,
  controls: ReadonlyMap<TeamId, TeamControl>,
): RoundState {
  let next = state;
  const humanTeams = sortedLivingTeams(next, controls, 'human');
  for (const team of humanTeams) {
    if (team.cards.length > 0) continue;
    const latestTeam = findTeam(next, team.teamNumber);
    if (latestTeam === undefined || latestTeam.cards.length > 0) continue;
    const draw = drawFromDeck(next.deck, 2);
    if (draw.drawn.length === 0) continue;
    const updated: TeamState = {
      ...latestTeam,
      cards: [...latestTeam.cards, ...draw.drawn],
    };
    next = updateTeam({ ...next, deck: draw.remaining }, updated);
  }
  return next;
}

function humanMovementTeams(
  state: RoundState,
  controls: ReadonlyMap<TeamId, TeamControl>,
): readonly TeamId[] {
  return sortedLivingTeams(state, controls, 'human')
    .filter((team) => team.cards.length > 0)
    .map((team) => team.teamNumber);
}

export function createSession(
  initial: RoundState,
  config: SessionConfig,
): {
  readonly state: RoundState;
  readonly step: (humanInputs?: HumanInputs) => SessionStep;
} {
  let current = initial;
  let pendingRequest: HumanInputRequest | null = null;
  let pendingMovementAttribute: Element | null = null;

  function applyBattle(
    battlePlays: ReadonlyMap<TeamId, BattlePlay> | undefined,
  ): void {
    const plays: BattlePlay[] = [];
    for (const team of allTeams(current)) {
      if (!isTeamAlive(team)) continue;
      const teamId = team.teamNumber;
      const control = controlFor(config.controls, teamId);
      if (control.type === 'human') {
        const play = battlePlays?.get(teamId) ?? { teamId, card: null };
        plays.push({ teamId, card: play.card });
        continue;
      }
      const battle = control.strategy.chooseBattlePlay(current, teamId);
      plays.push({ teamId, card: battle.card });
    }

    current = {
      ...resolveBattlePhase(current, plays, config.gameConfig ?? DEFAULT_CONFIG)
        .state,
      phase: 'forbidden',
    };
  }

  function prepareMovement(): readonly TeamId[] {
    if (pendingMovementAttribute !== null) {
      return humanMovementTeams(current, config.controls);
    }

    const moveDraw = drawFromDeck(current.deck, 1);
    if (moveDraw.drawn.length < 1) {
      current = { ...current, phase: 'revival' };
      pendingMovementAttribute = null;
      return [];
    }

    const attrCard = coerceToElementCard(moveDraw.drawn[0] as Card);
    pendingMovementAttribute = attrCard.element;
    current = primeHumanMovementHands(
      {
        ...current,
        deck: moveDraw.remaining,
        phase: 'movement',
      },
      config.controls,
    );
    return humanMovementTeams(current, config.controls);
  }

  function applyMovement(
    teamMoves: ReadonlyMap<TeamId, TeamMove> | undefined,
    humanTeams: readonly TeamId[],
  ): void {
    if (pendingMovementAttribute === null) {
      throw new Error('Movement attribute missing while resolving movement.');
    }

    const movementChoices: MovementChoice[] = [];
    for (const teamId of humanTeams) {
      const move = teamMoves?.get(teamId);
      if (move === undefined) continue;
      movementChoices.push({
        kind: 'explicit',
        teamId,
        card: move.card,
        intendedFacing: move.intendedFacing,
        ...(move.gridSwapIndex !== undefined
          ? { gridSwapIndex: move.gridSwapIndex }
          : {}),
      });
    }

    for (const team of sortedLivingTeams(current, config.controls, 'bot')) {
      const movement = teamControlStrategy(team.teamNumber).chooseTeamMove(
        current,
        team.teamNumber,
      );
      if (movement === null) continue;
      movementChoices.push({
        teamId: team.teamNumber,
        ...movement,
      });
    }

    const resolved = resolveMovementChoices(current, movementChoices);
    current = advanceMovement(
      resolved.state,
      pendingMovementAttribute,
      resolved.teamMoves,
    );
    pendingMovementAttribute = null;
  }

  function applyRevival(
    revivalActions: ReadonlyMap<TeamId, RevivalAction> | undefined,
  ): void {
    const choices = new Map<TeamId, RevivalAction>();

    for (const team of sortedLivingTeams(current, config.controls, 'bot')) {
      const revival = teamControlStrategy(team.teamNumber).chooseRevivalAction(
        current,
        team.teamNumber,
      );
      if (revival !== null) {
        choices.set(team.teamNumber, revival);
      }
    }

    for (const [teamId, action] of revivalActions ?? new Map()) {
      choices.set(teamId, action);
    }

    current = advanceRevival(current, choices);
  }

  function teamControlStrategy(teamId: TeamId): TeamStrategy {
    const control = controlFor(config.controls, teamId);
    if (control.type !== 'bot') {
      throw new Error(`Team ${teamId} is not bot-controlled.`);
    }
    return control.strategy;
  }

  function awaiting(request: HumanInputRequest): SessionStep {
    pendingRequest = request;
    return { status: 'awaiting', request, state: current };
  }

  return {
    get state() {
      return current;
    },
    step(humanInputs) {
      if (isGameOver(current)) {
        return { status: 'done', state: current };
      }

      if (pendingRequest !== null) {
        switch (pendingRequest.phase) {
          case 'battle':
            if (
              !hasCompleteInputs(
                pendingRequest.humanTeams,
                humanInputs?.battlePlays,
              )
            ) {
              return {
                status: 'awaiting',
                request: pendingRequest,
                state: current,
              };
            }
            break;
          case 'movement':
            if (
              !hasCompleteInputs(
                pendingRequest.humanTeams,
                humanInputs?.teamMoves,
              )
            ) {
              return {
                status: 'awaiting',
                request: pendingRequest,
                state: current,
              };
            }
            break;
          case 'revival':
            if (humanInputs?.revivalActions === undefined) {
              return {
                status: 'awaiting',
                request: pendingRequest,
                state: current,
              };
            }
            break;
        }
        pendingRequest = null;
      }

      while (true) {
        if (isGameOver(current)) {
          return { status: 'done', state: current };
        }

        switch (current.phase) {
          case 'battle': {
            const humanTeams = humanBattleTeams(current, config.controls);
            if (!hasCompleteInputs(humanTeams, humanInputs?.battlePlays)) {
              return awaiting({ phase: 'battle', humanTeams });
            }
            applyBattle(humanInputs?.battlePlays);
            humanInputs = undefined;
            continue;
          }
          case 'forbidden': {
            const forbiddenDraw = drawFromDeck(current.deck, 2);
            if (forbiddenDraw.drawn.length < 2) {
              current = { ...current, phase: 'movement' };
              continue;
            }
            current = advanceForbidden(
              { ...current, deck: forbiddenDraw.remaining },
              [
                coerceToElementCard(forbiddenDraw.drawn[0] as Card),
                coerceToElementCard(forbiddenDraw.drawn[1] as Card),
              ],
            );
            continue;
          }
          case 'movement': {
            const humanTeams = prepareMovement();
            if (pendingMovementAttribute === null) {
              continue;
            }
            if (!hasCompleteInputs(humanTeams, humanInputs?.teamMoves)) {
              return awaiting({
                phase: 'movement',
                humanTeams,
                movementAttribute: pendingMovementAttribute,
              });
            }
            applyMovement(humanInputs?.teamMoves, humanTeams);
            humanInputs = undefined;
            continue;
          }
          case 'revival': {
            const humanTeams = eligibleRevivalHumanTeams(
              current,
              config.controls,
            );
            if (
              humanInputs?.revivalActions === undefined &&
              humanTeams.length > 0
            ) {
              return awaiting({ phase: 'revival', humanTeams });
            }
            applyRevival(humanInputs?.revivalActions);
            return { status: 'done', state: current };
          }
        }
      }
    },
  };
}
