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
import { battleLogMessage, countDroppedTokenDelta } from '../logic/runner.ts';
import type { TeamStrategy } from '../strategy/strategy.ts';
import type { Card, Element } from '../types/card.ts';
import type { TeamState } from '../types/grid.ts';
import type { LogEntry } from '../types/log.ts';
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
      readonly log: readonly LogEntry[];
    }
  | {
      readonly status: 'done';
      readonly state: RoundState;
      readonly log: readonly LogEntry[];
    };

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

function sortedAllLivingTeams(state: RoundState): TeamState[] {
  return allTeams(state)
    .filter((team) => isTeamAlive(team))
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

function primeMovementFallbackHands(
  state: RoundState,
  controls: ReadonlyMap<TeamId, TeamControl>,
): {
  readonly state: RoundState;
  readonly preparedBotChoices: readonly MovementChoice[];
  readonly preparedBotTeams: ReadonlySet<TeamId>;
} {
  let next = state;
  const preparedBotChoices: MovementChoice[] = [];
  const preparedBotTeams = new Set<TeamId>();

  for (const team of sortedAllLivingTeams(next)) {
    if (team.cards.length > 0) {
      continue;
    }

    const latestTeam = findTeam(next, team.teamNumber);
    if (latestTeam === undefined || latestTeam.cards.length > 0) {
      continue;
    }

    const control = controlFor(controls, team.teamNumber);
    let botMovementChoice: ReturnType<TeamStrategy['chooseTeamMove']> = null;
    if (control.type === 'bot') {
      preparedBotTeams.add(team.teamNumber);
      const movement = control.strategy.chooseTeamMove(next, team.teamNumber);
      if (movement?.kind === 'explicit') {
        throw new RangeError(
          `Team ${team.teamNumber} cannot use an explicit movement choice with an empty hand.`,
        );
      }
      botMovementChoice = movement;
    }

    const draw = drawFromDeck(next.deck, 2);
    if (draw.drawn.length === 0) {
      continue;
    }
    const [firstDrawnCard, secondDrawnCard] = draw.drawn;

    const updated: TeamState = {
      ...latestTeam,
      cards: [...latestTeam.cards, ...draw.drawn],
    };
    next = updateTeam({ ...next, deck: draw.remaining }, updated);

    if (botMovementChoice?.kind === 'emergency-draw') {
      if (firstDrawnCard === undefined) {
        continue;
      }
      const selectedCard =
        botMovementChoice.emergencyDrawPick === 1
          ? (secondDrawnCard ?? firstDrawnCard)
          : firstDrawnCard;
      preparedBotChoices.push({
        kind: 'explicit',
        teamId: team.teamNumber,
        card: selectedCard,
        intendedFacing: botMovementChoice.intendedFacing,
        ...(botMovementChoice.gridSwapIndex !== undefined
          ? { gridSwapIndex: botMovementChoice.gridSwapIndex }
          : {}),
      });
    }
  }

  return {
    state: next,
    preparedBotChoices,
    preparedBotTeams,
  };
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
  let completed = false;
  let pendingRequest: HumanInputRequest | null = null;
  let pendingMovementAttribute: Element | null = null;
  let pendingPreparedBotMovementChoices: readonly MovementChoice[] = [];
  let pendingPreparedBotMovementTeams = new Set<TeamId>();

  function applyBattle(
    battlePlays: ReadonlyMap<TeamId, BattlePlay> | undefined,
    stepLog: LogEntry[],
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

    const round = current.round;
    const resolved = resolveBattlePhase(
      current,
      plays,
      config.gameConfig ?? DEFAULT_CONFIG,
    );
    for (const result of resolved.results) {
      stepLog.push({
        round,
        phase: 'battle',
        message: battleLogMessage(result),
      });
    }
    current = isGameOver(resolved.state)
      ? resolved.state
      : { ...resolved.state, phase: 'forbidden' };
  }

  function prepareMovement(): readonly TeamId[] {
    if (pendingMovementAttribute !== null) {
      return humanMovementTeams(current, config.controls);
    }

    pendingPreparedBotMovementChoices = [];
    pendingPreparedBotMovementTeams = new Set<TeamId>();

    const moveDraw = drawFromDeck(current.deck, 1);
    if (moveDraw.drawn.length < 1) {
      current = { ...current, phase: 'revival' };
      pendingMovementAttribute = null;
      return [];
    }

    const attrCard = coerceToElementCard(moveDraw.drawn[0] as Card);
    pendingMovementAttribute = attrCard.element;
    const prepared = primeMovementFallbackHands(
      {
        ...current,
        deck: moveDraw.remaining,
        phase: 'movement',
      },
      config.controls,
    );
    current = prepared.state;
    pendingPreparedBotMovementChoices = prepared.preparedBotChoices;
    pendingPreparedBotMovementTeams = new Set(prepared.preparedBotTeams);
    return humanMovementTeams(current, config.controls);
  }

  function applyMovement(
    teamMoves: ReadonlyMap<TeamId, TeamMove> | undefined,
    humanTeams: readonly TeamId[],
    stepLog: LogEntry[],
  ): void {
    if (pendingMovementAttribute === null) {
      throw new Error('Movement attribute missing while resolving movement.');
    }

    const movementChoices: MovementChoice[] = [
      ...pendingPreparedBotMovementChoices,
    ];
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
      if (pendingPreparedBotMovementTeams.has(team.teamNumber)) {
        continue;
      }
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

    const round = current.round;
    const resolved = resolveMovementChoices(
      current,
      movementChoices,
      (message) => {
        stepLog.push({ round, phase: 'movement', message });
      },
      { skipInvalidExplicitChoiceTeamIds: new Set(humanTeams) },
    );
    const beforeMovement = resolved.state;
    current = advanceMovement(
      beforeMovement,
      pendingMovementAttribute,
      resolved.teamMoves,
    );
    stepLog.push({
      round,
      phase: 'movement',
      message: `Movement resolution: ${resolved.teamMoves.length} moves resolved`,
    });
    const movementPenalties = countDroppedTokenDelta(beforeMovement, current);
    if (movementPenalties > 0) {
      stepLog.push({
        round,
        phase: 'movement',
        message: `Forbidden-cell penalty dropped ${movementPenalties} life token(s)`,
      });
    }
    pendingMovementAttribute = null;
    pendingPreparedBotMovementChoices = [];
    pendingPreparedBotMovementTeams = new Set<TeamId>();
  }

  function applyRevival(
    revivalActions: ReadonlyMap<TeamId, RevivalAction> | undefined,
    stepLog: LogEntry[],
  ): void {
    const choices = new Map<TeamId, RevivalAction>();
    const eligibleHumanTeams = new Set(
      eligibleRevivalHumanTeams(current, config.controls),
    );

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
      if (!eligibleHumanTeams.has(teamId)) {
        continue;
      }
      choices.set(teamId, action);
    }

    const round = current.round;
    current = advanceRevival(current, choices);
    for (const [teamId, action] of choices) {
      stepLog.push({
        round,
        phase: 'revival',
        message: `Team ${teamId} chose ${action.type}`,
      });
    }
  }

  function teamControlStrategy(teamId: TeamId): TeamStrategy {
    const control = controlFor(config.controls, teamId);
    if (control.type !== 'bot') {
      throw new Error(`Team ${teamId} is not bot-controlled.`);
    }
    return control.strategy;
  }

  function awaiting(
    request: HumanInputRequest,
    stepLog: readonly LogEntry[],
  ): SessionStep {
    pendingRequest = request;
    return { status: 'awaiting', request, state: current, log: stepLog };
  }

  return {
    get state() {
      return current;
    },
    step(humanInputs) {
      const stepLog: LogEntry[] = [];
      if (completed || isGameOver(current)) {
        completed = true;
        return { status: 'done', state: current, log: stepLog };
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
                log: stepLog,
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
                log: stepLog,
              };
            }
            break;
          case 'revival':
            if (
              !hasCompleteInputs(
                pendingRequest.humanTeams,
                humanInputs?.revivalActions,
              )
            ) {
              return {
                status: 'awaiting',
                request: pendingRequest,
                state: current,
                log: stepLog,
              };
            }
            break;
        }
        pendingRequest = null;
      }

      while (true) {
        if (isGameOver(current)) {
          completed = true;
          return { status: 'done', state: current, log: stepLog };
        }

        switch (current.phase) {
          case 'battle': {
            const humanTeams = humanBattleTeams(current, config.controls);
            if (!hasCompleteInputs(humanTeams, humanInputs?.battlePlays)) {
              return awaiting({ phase: 'battle', humanTeams }, stepLog);
            }
            applyBattle(humanInputs?.battlePlays, stepLog);
            humanInputs = undefined;
            continue;
          }
          case 'forbidden': {
            const round = current.round;
            const forbiddenDraw = drawFromDeck(current.deck, 2);
            if (forbiddenDraw.drawn.length < 2) {
              stepLog.push({
                round,
                phase: 'forbidden',
                message: 'Deck exhausted: forbidden phase skipped',
              });
              current = { ...current, phase: 'movement' };
              continue;
            }
            const cardX = coerceToElementCard(forbiddenDraw.drawn[0] as Card);
            const cardY = coerceToElementCard(forbiddenDraw.drawn[1] as Card);
            current = advanceForbidden(
              { ...current, deck: forbiddenDraw.remaining },
              [cardX, cardY],
            );
            stepLog.push({
              round,
              phase: 'forbidden',
              message: `New forbidden cell: (${cardX.element}, ${cardY.element})`,
            });
            continue;
          }
          case 'movement': {
            const round = current.round;
            const justDrawingAttribute = pendingMovementAttribute === null;
            const humanTeams = prepareMovement();
            if (pendingMovementAttribute === null) {
              if (justDrawingAttribute) {
                stepLog.push({
                  round,
                  phase: 'movement',
                  message: 'Deck exhausted: movement phase skipped',
                });
              }
              continue;
            }
            if (justDrawingAttribute) {
              stepLog.push({
                round,
                phase: 'movement',
                message: `Movement attribute: ${pendingMovementAttribute}`,
              });
            }
            if (!hasCompleteInputs(humanTeams, humanInputs?.teamMoves)) {
              return awaiting(
                {
                  phase: 'movement',
                  humanTeams,
                  movementAttribute: pendingMovementAttribute,
                },
                stepLog,
              );
            }
            applyMovement(humanInputs?.teamMoves, humanTeams, stepLog);
            humanInputs = undefined;
            continue;
          }
          case 'revival': {
            const humanTeams = eligibleRevivalHumanTeams(
              current,
              config.controls,
            );
            if (!hasCompleteInputs(humanTeams, humanInputs?.revivalActions)) {
              return awaiting({ phase: 'revival', humanTeams }, stepLog);
            }
            applyRevival(humanInputs?.revivalActions, stepLog);
            completed = true;
            return { status: 'done', state: current, log: stepLog };
          }
        }
      }
    },
  };
}
