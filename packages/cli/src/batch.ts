import {
  type BattlePlay,
  DEFAULT_CONFIG,
  type GameConfig,
  isGameOver,
  isTeamAlive,
  type MovementChoice,
  type RevivalAction,
  type RoundInputs,
  type RoundState,
  randomStrategy,
  runRound,
  type StrategyMovementChoice,
  setupGame,
  type TeamId,
  type TeamState,
  type TeamStrategy,
  winner as winnerOf,
} from '@kurone-kito/oneiron-core';

const GRID_AXES = ['fire', 'water', 'wood'] as const;

function listAllTeams(state: RoundState): TeamState[] {
  const teams: TeamState[] = [];
  for (const x of GRID_AXES) {
    for (const y of GRID_AXES) {
      for (const team of state.grid[x][y]) {
        teams.push(team);
      }
    }
  }
  return teams;
}

const DEFAULT_MAX_ROUNDS_PER_GAME = 50;
const DEFAULT_STRATEGY_SEED = 0;

export type BatchInput = {
  readonly playerCount: number;
  readonly seedStart: number;
  readonly gameCount: number;
  readonly maxRoundsPerGame?: number;
  readonly config?: GameConfig;
  readonly strategySeed?: number;
};

export type GameOutcome = {
  readonly seed: number;
  readonly winner: TeamId | null;
  readonly rounds: number;
  readonly survivingTeams: readonly TeamId[];
  readonly totalDamageDealt: number;
  readonly graveyardSize: number;
  /**
   * Teams that started the game with a single player (i.e. were
   * "solo teams" after setup). Used by the report layer to compute
   * solo-team win rates without a separate setup snapshot.
   */
  readonly soloTeams: readonly TeamId[];
};

export type BatchOutput = {
  readonly outcomes: readonly GameOutcome[];
};

function buildStrategies(
  state: RoundState,
  strategySeed: number,
): ReadonlyMap<TeamId, TeamStrategy> {
  const strategies = new Map<TeamId, TeamStrategy>();
  for (const team of listAllTeams(state)) {
    strategies.set(
      team.teamNumber,
      randomStrategy(strategySeed + team.teamNumber),
    );
  }
  return strategies;
}

function normalizeMovementChoice(
  team: TeamState,
  choice: StrategyMovementChoice,
): MovementChoice {
  // The InputProvider runs at round-start, but movement resolution
  // happens after battle has consumed cards. An explicit pick that
  // names the card battle consumed (or a 1-card hand that loses its
  // only card to battle) would throw inside resolveMovementChoices,
  // so always demote to emergency-draw — its fallback path picks
  // team.cards[0] when the hand is non-empty and draws fresh cards
  // when it is empty. This is sub-optimal compared to a hand-aware
  // pick, but it never strands the round and keeps random bots
  // deterministic across runs.
  const base = {
    teamId: team.teamNumber,
    kind: 'emergency-draw' as const,
    intendedFacing: choice.intendedFacing,
  };
  return choice.gridSwapIndex !== undefined
    ? { ...base, gridSwapIndex: choice.gridSwapIndex }
    : base;
}

function makeInputProvider(
  strategies: ReadonlyMap<TeamId, TeamStrategy>,
): (state: RoundState) => RoundInputs {
  return (state) => {
    const livingTeams = listAllTeams(state).filter(isTeamAlive);
    const plays: BattlePlay[] = [];
    const teamMoves: MovementChoice[] = [];
    const revivalChoices = new Map<TeamId, RevivalAction>();

    for (const team of livingTeams) {
      const strategy = strategies.get(team.teamNumber);
      if (strategy === undefined) continue;

      const battle = strategy.chooseBattlePlay(state, team.teamNumber);
      plays.push({ teamId: team.teamNumber, card: battle.card });

      const movement = strategy.chooseTeamMove(state, team.teamNumber);
      if (movement !== null) {
        teamMoves.push(normalizeMovementChoice(team, movement));
      }

      const revival = strategy.chooseRevivalAction(state, team.teamNumber);
      if (revival !== null) {
        revivalChoices.set(team.teamNumber, revival);
      }
    }

    return {
      battle: { plays },
      movement: { teamMoves },
      revival: { choices: revivalChoices },
    };
  };
}

export function runBatch(input: BatchInput): BatchOutput {
  const maxRounds = input.maxRoundsPerGame ?? DEFAULT_MAX_ROUNDS_PER_GAME;
  const gameConfig = input.config ?? DEFAULT_CONFIG;
  const strategySeed = input.strategySeed ?? DEFAULT_STRATEGY_SEED;

  const outcomes: GameOutcome[] = [];
  for (let i = 0; i < input.gameCount; i += 1) {
    const seed = input.seedStart + i;
    const initial = setupGame(
      { playerCount: input.playerCount, seed },
      gameConfig,
    );
    const strategies = buildStrategies(initial, strategySeed);
    const inputProvider = makeInputProvider(strategies);
    const soloTeams = listAllTeams(initial)
      .filter((team) => team.players.length === 1)
      .map((team) => team.teamNumber);

    let current = initial;
    let rounds = 0;
    let totalDamageDealt = 0;

    while (rounds < maxRounds && !isGameOver(current)) {
      const inputs = inputProvider(current);
      const round = runRound(current, inputs);
      for (const result of round.battleResults) {
        totalDamageDealt += result.damage;
      }
      current = round.state;
      rounds += 1;
    }

    const survivingTeams = listAllTeams(current)
      .filter(isTeamAlive)
      .map((team) => team.teamNumber);

    outcomes.push({
      seed,
      winner: winnerOf(current),
      rounds,
      survivingTeams,
      totalDamageDealt,
      graveyardSize: current.graveyard?.length ?? 0,
      soloTeams,
    });
  }

  return { outcomes };
}
