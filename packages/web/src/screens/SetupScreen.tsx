import { DEFAULT_CONFIG, type GameConfig } from '@kurone-kito/oneiron-core';
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Show,
  untrack,
} from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import {
  buildControlSelections,
  buildControlsMap,
  type ControlMode,
  clampPlayerCount,
  cloneConfig,
  createRandomSeed,
  deriveSetupConfigLimits,
  deriveTeamSummaries,
  MAX_PLAYER_COUNT,
  MAX_STARTABLE_PLAYER_COUNT,
  MIN_PLAYER_COUNT,
  normalizeSeed,
  normalizeSetupConfig,
  type SetupValues,
} from './setup-screen-model.ts';

type Props = {
  onStart: (values: SetupValues) => void;
};

type ConfigDraft = {
  -readonly [Key in keyof GameConfig]: GameConfig[Key];
};

const CONFIG_FIELD_MINIMUMS: Readonly<Record<keyof ConfigDraft, number>> = {
  cardCopies: 1,
  deckExtractFactor: 1,
  randomCardsDealt: 0,
  battleTimeLimitMin: 1,
  damageOverflowFactor: 1,
};

function updateInteger(
  rawValue: number,
  fallback: number,
  normalize: (value: number) => number = Math.trunc,
): number {
  return Number.isFinite(rawValue) ? normalize(rawValue) : fallback;
}

export function SetupScreen(props: Props) {
  const initialSeed = createRandomSeed();
  const [playerCount, setPlayerCount] = createSignal(6);
  const [seed, setSeed] = createSignal(initialSeed);
  const [seedText, setSeedText] = createSignal(String(initialSeed));
  const [config, setConfig] = createStore<ConfigDraft>(
    cloneConfig(DEFAULT_CONFIG),
  );
  const [controlSelections, setControlSelections] = createStore<
    Record<number, ControlMode>
  >({});

  const teamSummaries = createMemo(() => deriveTeamSummaries(playerCount()));
  const configLimits = createMemo(() =>
    deriveSetupConfigLimits(playerCount(), config),
  );
  const startBlocked = createMemo(
    () => playerCount() > MAX_STARTABLE_PLAYER_COUNT,
  );

  createEffect(() => {
    const nextTeams = teamSummaries();
    const previousSelections = untrack(() => ({ ...controlSelections }));
    setControlSelections(
      reconcile(buildControlSelections(nextTeams, previousSelections)),
    );
  });

  createEffect(() => {
    const count = playerCount();
    setConfig(
      reconcile(
        normalizeSetupConfig(
          untrack(() => cloneConfig(config)),
          count,
        ),
      ),
    );
  });

  function parseSeedText(value: string): number {
    if (value.trim() === '') {
      return Number.NaN;
    }
    // `Number(...)` intentionally accepts signed and scientific-notation drafts.
    return Number(value);
  }

  function commitSeedText(): number {
    const normalizedSeed = normalizeSeed(parseSeedText(seedText()), seed());
    setSeed(normalizedSeed);
    setSeedText(String(normalizedSeed));
    return normalizedSeed;
  }

  function updateConfigField<Key extends keyof ConfigDraft>(
    key: Key,
    rawValue: number,
  ) {
    const nextConfig = normalizeSetupConfig(
      {
        ...cloneConfig(config),
        [key]: updateInteger(rawValue, config[key], (value) =>
          Math.max(CONFIG_FIELD_MINIMUMS[key], Math.trunc(value)),
        ),
      },
      playerCount(),
    );
    setConfig(reconcile(nextConfig));
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (startBlocked()) {
      return;
    }
    const normalizedSeed = commitSeedText();
    const normalizedConfig = normalizeSetupConfig(
      cloneConfig(config),
      playerCount(),
    );
    props.onStart({
      playerCount: playerCount(),
      seed: normalizedSeed,
      config: normalizedConfig,
      controls: buildControlsMap(
        teamSummaries(),
        controlSelections,
        normalizedSeed,
      ),
    });
  }

  return (
    <section class="setup-screen" aria-label="Game setup">
      <header class="setup-screen__header">
        <p class="setup-screen__eyebrow">Wave-6 setup</p>
        <h1>Dream Duels Setup</h1>
        <p>
          Configure the roster, seed, and A-E values before handing the table to
          the session manager.
        </p>
      </header>

      <form class="setup-screen__form" onSubmit={handleSubmit}>
        <fieldset class="setup-screen__group">
          <legend>Match setup</legend>

          <label class="setup-screen__field" for="player-count">
            <span class="setup-screen__field-label">Player count</span>
            <input
              id="player-count"
              type="number"
              min={MIN_PLAYER_COUNT}
              max={MAX_PLAYER_COUNT}
              step="1"
              value={playerCount()}
              onInput={(event) =>
                setPlayerCount(
                  clampPlayerCount(
                    updateInteger(
                      event.currentTarget.valueAsNumber,
                      playerCount(),
                    ),
                  ),
                )
              }
            />
          </label>

          <div class="setup-screen__field">
            <label class="setup-screen__field-label" for="seed">
              Seed
            </label>
            <div class="setup-screen__seed-row">
              <input
                id="seed"
                type="text"
                inputMode="numeric"
                value={seedText()}
                onInput={(event) => setSeedText(event.currentTarget.value)}
                onBlur={commitSeedText}
              />
              <button
                type="button"
                onClick={() => {
                  const nextSeed = createRandomSeed();
                  setSeed(nextSeed);
                  setSeedText(String(nextSeed));
                }}
                aria-label="Randomise seed"
              >
                Randomise seed
              </button>
            </div>
          </div>
        </fieldset>

        <fieldset class="setup-screen__group">
          <legend>Per-team control</legend>
          <ul class="setup-screen__team-list" aria-label="Derived teams">
            <For each={teamSummaries()}>
              {(team) => (
                <li class="setup-screen__team-row">
                  <label
                    class="setup-screen__team-label"
                    for={`team-control-${team.teamId}`}
                  >
                    {team.label}
                  </label>
                  <select
                    id={`team-control-${team.teamId}`}
                    value={controlSelections[team.teamId] ?? 'bot'}
                    onChange={(event) =>
                      setControlSelections(
                        team.teamId,
                        event.currentTarget.value as ControlMode,
                      )
                    }
                  >
                    <option value="human">Human</option>
                    <option value="bot">Bot</option>
                  </select>
                  <span class="setup-screen__team-meta">
                    {team.memberCount} player(s)
                  </span>
                </li>
              )}
            </For>
          </ul>
        </fieldset>

        <Show when={startBlocked()}>
          <p class="setup-screen__status" role="status">
            Current engine start is capped at 18 players because the 3x3 grid
            can host at most 9 teams.
          </p>
        </Show>

        <details class="setup-screen__advanced">
          <summary>A-E values (advanced)</summary>

          <label for="config-a">Card copies (A)</label>
          <input
            id="config-a"
            type="number"
            min="1"
            max={configLimits().cardCopies}
            step="1"
            value={config.cardCopies}
            onInput={(event) =>
              updateConfigField('cardCopies', event.currentTarget.valueAsNumber)
            }
          />

          <label for="config-b">Deck extract factor (B)</label>
          <input
            id="config-b"
            type="number"
            min="1"
            max={configLimits().deckExtractFactor}
            step="1"
            value={config.deckExtractFactor}
            onInput={(event) =>
              updateConfigField(
                'deckExtractFactor',
                event.currentTarget.valueAsNumber,
              )
            }
          />

          <label for="config-c">Random cards dealt (C)</label>
          <input
            id="config-c"
            type="number"
            min="0"
            max={configLimits().randomCardsDealt}
            step="1"
            value={config.randomCardsDealt}
            onInput={(event) =>
              updateConfigField(
                'randomCardsDealt',
                event.currentTarget.valueAsNumber,
              )
            }
          />

          <label for="config-d">Battle time limit minutes (D)</label>
          <input
            id="config-d"
            type="number"
            min="1"
            step="1"
            value={config.battleTimeLimitMin}
            onInput={(event) =>
              updateConfigField(
                'battleTimeLimitMin',
                event.currentTarget.valueAsNumber,
              )
            }
          />

          <label for="config-e">Damage overflow factor (E)</label>
          <input
            id="config-e"
            type="number"
            min="1"
            step="1"
            value={config.damageOverflowFactor}
            onInput={(event) =>
              updateConfigField(
                'damageOverflowFactor',
                event.currentTarget.valueAsNumber,
              )
            }
          />
        </details>

        <div class="setup-screen__actions">
          <button
            class="setup-screen__submit"
            type="submit"
            disabled={startBlocked()}
          >
            Start game
          </button>
        </div>
      </form>
    </section>
  );
}

export type { SetupValues } from './setup-screen-model.ts';
