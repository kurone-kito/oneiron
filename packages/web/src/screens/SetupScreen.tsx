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
  deriveTeamSummaries,
  MAX_PLAYER_COUNT,
  MAX_STARTABLE_PLAYER_COUNT,
  MIN_PLAYER_COUNT,
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
  return Number.isNaN(rawValue) ? fallback : normalize(rawValue);
}

export function SetupScreen(props: Props) {
  const [playerCount, setPlayerCount] = createSignal(6);
  const [seed, setSeed] = createSignal(createRandomSeed());
  const [config, setConfig] = createStore<ConfigDraft>(
    cloneConfig(DEFAULT_CONFIG),
  );
  const [controlSelections, setControlSelections] = createStore<
    Record<number, ControlMode>
  >({});

  const teamSummaries = createMemo(() => deriveTeamSummaries(playerCount()));
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

  function updateConfigField<Key extends keyof ConfigDraft>(
    key: Key,
    rawValue: number,
  ) {
    const minimum = CONFIG_FIELD_MINIMUMS[key];
    setConfig(
      key,
      updateInteger(rawValue, config[key], (value) =>
        Math.max(minimum, Math.trunc(value)),
      ),
    );
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (startBlocked()) {
      return;
    }
    props.onStart({
      playerCount: playerCount(),
      seed: seed(),
      config: cloneConfig(config),
      controls: buildControlsMap(teamSummaries(), controlSelections, seed()),
    });
  }

  return (
    <section aria-label="Game setup">
      <header>
        <p>Wave-6 setup</p>
        <h1>Dream Duels Setup</h1>
        <p>
          Configure the roster, seed, and A-E values before handing the table to
          the session manager.
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>Match setup</legend>

          <label for="player-count">Player count</label>
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

          <label for="seed">Seed</label>
          <div>
            <input
              id="seed"
              type="number"
              step="1"
              value={seed()}
              onInput={(event) =>
                setSeed(
                  updateInteger(event.currentTarget.valueAsNumber, seed()),
                )
              }
            />
            <button
              type="button"
              onClick={() => setSeed(createRandomSeed())}
              aria-label="Randomise seed"
            >
              Randomise seed
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>Per-team control</legend>
          <ul aria-label="Derived teams">
            <For each={teamSummaries()}>
              {(team) => (
                <li>
                  <label for={`team-control-${team.teamId}`}>
                    {team.label}
                  </label>
                  <select
                    id={`team-control-${team.teamId}`}
                    aria-label={`Control for Team ${team.teamId}`}
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
                  <span>{team.memberCount} player(s)</span>
                </li>
              )}
            </For>
          </ul>
        </fieldset>

        <Show when={startBlocked()}>
          <p role="status">
            Current engine start is capped at 18 players because the 3x3 grid
            can host at most 9 teams.
          </p>
        </Show>

        <details>
          <summary>A-E values</summary>

          <label for="config-a">Card copies (A)</label>
          <input
            id="config-a"
            type="number"
            min="1"
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

        <button type="submit" disabled={startBlocked()}>
          Start game
        </button>
      </form>
    </section>
  );
}

export type { SetupValues } from './setup-screen-model.ts';
