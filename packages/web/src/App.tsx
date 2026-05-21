import {
  createSession,
  type RoundState,
  setupGame,
} from '@kurone-kito/oneiron-core';
import { createSignal, For, Match, Switch } from 'solid-js';
import { GameGrid } from './components/Grid.tsx';
import { SetupScreen, type SetupValues } from './screens/SetupScreen.tsx';
import {
  cloneConfig,
  deriveTeamSummaries,
  MAX_STARTABLE_PLAYER_COUNT,
  MIN_PLAYER_COUNT,
  normalizeSeed,
  normalizeSetupConfig,
} from './screens/setup-screen-model.ts';

type PlayingState = {
  readonly mode: 'playing';
  readonly initialState: RoundState;
  readonly session: ReturnType<typeof createSession>;
  readonly setup: SetupValues;
};

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 1;
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function isSameConfig(
  left: SetupValues['config'],
  right: SetupValues['config'],
) {
  return (
    left.cardCopies === right.cardCopies &&
    left.deckExtractFactor === right.deckExtractFactor &&
    left.randomCardsDealt === right.randomCardsDealt &&
    left.battleTimeLimitMin === right.battleTimeLimitMin &&
    left.damageOverflowFactor === right.damageOverflowFactor
  );
}

function isValidSetupValues(values: SetupValues): boolean {
  const normalizedConfig = normalizeSetupConfig(
    cloneConfig(values.config),
    values.playerCount,
  );
  if (
    !Number.isInteger(values.playerCount) ||
    values.playerCount < MIN_PLAYER_COUNT ||
    values.playerCount > MAX_STARTABLE_PLAYER_COUNT ||
    !Number.isInteger(values.seed) ||
    values.seed !== normalizeSeed(values.seed, values.seed)
  ) {
    return false;
  }

  if (
    !isPositiveInteger(values.config.cardCopies) ||
    !isPositiveInteger(values.config.deckExtractFactor) ||
    !isNonNegativeInteger(values.config.randomCardsDealt) ||
    !isPositiveInteger(values.config.battleTimeLimitMin) ||
    !isPositiveInteger(values.config.damageOverflowFactor) ||
    !isSameConfig(values.config, normalizedConfig)
  ) {
    return false;
  }

  if (!(values.controls instanceof Map)) {
    return false;
  }

  const expectedTeams = deriveTeamSummaries(values.playerCount);
  if (values.controls.size !== expectedTeams.length) {
    return false;
  }

  return expectedTeams.every((team) => {
    const control = values.controls.get(team.teamId);
    return (
      control?.type === 'human' ||
      (control?.type === 'bot' && control.strategy !== undefined)
    );
  });
}

export function App() {
  const [view, setView] = createSignal<{ mode: 'setup' } | PlayingState>({
    mode: 'setup',
  });

  function handleStart(values: SetupValues) {
    if (!isValidSetupValues(values)) {
      // Defence-in-depth: SetupScreen guards this path via startBlocked(),
      // but log an error so regressions are immediately diagnosable.
      console.error('[App] handleStart received invalid setup values', values);
      return;
    }

    const initialState = setupGame(
      { playerCount: values.playerCount, seed: values.seed },
      values.config,
    );
    const session = createSession(initialState, {
      controls: values.controls,
      gameConfig: values.config,
    });

    setView({
      mode: 'playing',
      initialState,
      session,
      setup: values,
    });
  }

  return (
    <main>
      <Switch>
        <Match when={view().mode === 'setup'}>
          <SetupScreen onStart={handleStart} />
        </Match>
        <Match when={view().mode === 'playing'}>
          {(() => {
            const playing = view() as PlayingState;
            const activeState = playing.session.state;
            const controlSummary = Array.from(playing.setup.controls.entries())
              .sort(([left], [right]) => Number(left) - Number(right))
              .map(([teamId, control]) => ({
                teamId,
                control: control.type,
              }));

            return (
              <section aria-label="Playing placeholder">
                <header>
                  <p>Wave-6 placeholder</p>
                  <h1>Game session ready</h1>
                  <p>
                    Round {activeState.round} begins in the {activeState.phase}{' '}
                    phase. Full interactive controls land in #126.
                  </p>
                </header>

                <GameGrid
                  grid={activeState.grid}
                  forbiddenCells={activeState.forbiddenCells}
                  currentPhase={activeState.phase}
                />

                <section aria-label="Session summary">
                  <h2>Session summary</h2>
                  <p>Seed: {playing.setup.seed}</p>
                  <p>Deck size: {activeState.deck?.length ?? 0}</p>
                  <p>Initial phase: {playing.initialState.phase}</p>
                  <ul aria-label="Configured controls">
                    <For each={controlSummary}>
                      {(entry) => (
                        <li>
                          Team {entry.teamId}: {entry.control}
                        </li>
                      )}
                    </For>
                  </ul>
                </section>
              </section>
            );
          })()}
        </Match>
      </Switch>
    </main>
  );
}
