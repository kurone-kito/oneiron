import { type RoundState, setupGame } from '@kurone-kito/oneiron-core';
import { createSignal, Match, Switch } from 'solid-js';
import { UpdatePrompt } from './components/UpdatePrompt.tsx';
import { GameplayScreen } from './screens/GameplayScreen.tsx';
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

    setView({
      mode: 'playing',
      initialState,
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
            return (
              <GameplayScreen
                initialState={playing.initialState}
                config={{
                  controls: playing.setup.controls,
                  gameConfig: playing.setup.config,
                }}
              />
            );
          })()}
        </Match>
      </Switch>
      <UpdatePrompt />
    </main>
  );
}
