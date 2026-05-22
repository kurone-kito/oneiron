import type {
  BattlePlay,
  Card,
  Facing,
  HumanInputRequest,
  HumanInputs,
  LogEntry,
  RevivalAction,
  RoundState,
  SessionConfig,
  TeamControl,
  TeamId,
  TeamMove,
  TeamState,
} from '@kurone-kito/oneiron-core';
import {
  createSession,
  ELEMENT_AXIS,
  isGameOver,
  winner as winnerOf,
} from '@kurone-kito/oneiron-core';
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
} from 'solid-js';
import { CardFace } from '../components/CardFace.tsx';
import { GameGrid } from '../components/Grid.tsx';
import { Hand } from '../components/Hand.tsx';
import { TurnLog } from '../components/TurnLog.tsx';

export type GameplayScreenProps = {
  readonly initialState: RoundState;
  readonly config: SessionConfig;
};

const FACINGS: readonly Facing[] = ['north', 'east', 'south', 'west'];
const REVIVAL_ACTIONS: readonly RevivalAction['type'][] = [
  'revive-member',
  'charge-life',
  'charge-cards',
];

const MIN_AUTOPLAY_DELAY_MS = 0;
const MAX_AUTOPLAY_DELAY_MS = 2000;
const DEFAULT_AUTOPLAY_DELAY_MS = 200;
const LOG_RETENTION = 500;

function listLivingTeams(state: RoundState): TeamState[] {
  const teams: TeamState[] = [];
  for (const x of ELEMENT_AXIS) {
    for (const y of ELEMENT_AXIS) {
      for (const team of state.grid[x][y]) {
        if (team.players.some((p) => p.life > 0)) {
          teams.push(team);
        }
      }
    }
  }
  return teams.sort((a, b) => a.teamNumber - b.teamNumber);
}

function findTeam(state: RoundState, teamId: TeamId): TeamState | undefined {
  return listLivingTeams(state).find((t) => t.teamNumber === teamId);
}

function teamLife(team: TeamState): number {
  return team.players.reduce((sum, p) => sum + p.life, 0);
}

function describeCard(card: Card): string {
  return card.kind === 'joker' ? 'Joker' : `${card.element} ${card.value}`;
}

function cardKey(card: Card, idx: number): string {
  return card.kind === 'joker'
    ? `joker@${idx}`
    : `${card.element}-${card.value}@${idx}`;
}

function controlsAreAllBot(
  controls: ReadonlyMap<TeamId, TeamControl>,
): boolean {
  if (controls.size === 0) return false;
  for (const control of controls.values()) {
    if (control.type !== 'bot') return false;
  }
  return true;
}

export function GameplayScreen(props: GameplayScreenProps) {
  let session = createSession(props.initialState, props.config);

  const [history, setHistory] = createSignal<readonly RoundState[]>([
    props.initialState,
  ]);
  const [viewIndex, setViewIndex] = createSignal(0);
  const [pending, setPending] = createSignal<HumanInputRequest | null>(null);
  const [log, setLog] = createSignal<readonly LogEntry[]>([]);
  const [over, setOver] = createSignal(false);

  const [autoPlayActive, setAutoPlayActive] = createSignal(false);
  const [autoPlayDelayMs, setAutoPlayDelayMs] = createSignal(
    DEFAULT_AUTOPLAY_DELAY_MS,
  );

  const [drawerOpen, setDrawerOpen] = createSignal(false);

  function toggleDrawer(): void {
    setDrawerOpen((open) => !open);
  }
  function closeDrawer(): void {
    setDrawerOpen(false);
  }

  const headState = createMemo(() => {
    const frames = history();
    return frames[frames.length - 1] as RoundState;
  });
  const displayedState = createMemo(
    () => history()[viewIndex()] ?? headState(),
  );
  const isViewingHistory = createMemo(
    () => viewIndex() !== history().length - 1,
  );
  const isAllBot = createMemo(() => controlsAreAllBot(props.config.controls));

  const [battleSelections, setBattleSelections] = createSignal<
    ReadonlyMap<TeamId, string | null>
  >(new Map());
  const [moveSelections, setMoveSelections] = createSignal<
    ReadonlyMap<TeamId, { cardKey: string; facing: Facing; slot: 0 | 1 }>
  >(new Map());
  const [revivalSelections, setRevivalSelections] = createSignal<
    ReadonlyMap<TeamId, RevivalAction['type']>
  >(new Map());

  function pushState(next: RoundState): void {
    setHistory((frames) => [...frames, next]);
    setViewIndex(history().length - 1);
  }

  function resetFormsFor(request: HumanInputRequest | null): void {
    if (request === null) {
      setBattleSelections(new Map());
      setMoveSelections(new Map());
      setRevivalSelections(new Map());
      return;
    }
    switch (request.phase) {
      case 'battle': {
        const next = new Map<TeamId, string | null>();
        for (const id of request.humanTeams) next.set(id, null);
        setBattleSelections(next);
        break;
      }
      case 'movement': {
        const next = new Map<
          TeamId,
          { cardKey: string; facing: Facing; slot: 0 | 1 }
        >();
        for (const id of request.humanTeams) {
          const team = findTeam(headState(), id);
          const firstCard = team?.cards[0];
          next.set(id, {
            cardKey: firstCard ? cardKey(firstCard, 0) : '',
            facing: team?.facing ?? 'north',
            slot: 0,
          });
        }
        setMoveSelections(next);
        break;
      }
      case 'revival': {
        const next = new Map<TeamId, RevivalAction['type']>();
        for (const id of request.humanTeams) next.set(id, 'charge-life');
        setRevivalSelections(next);
        break;
      }
    }
  }

  /**
   * Drives the session forward. Pushes a history frame after every
   * `session.step` call so the replay UI can scrub through past
   * states. Stops at the first awaiting request, at game-over, or
   * once the round completes (so the auto-play loop can insert a
   * delay between rounds).
   *
   * Returns the terminal status so callers know whether to keep
   * ticking ('round-done') or wait for input ('awaiting' / 'game-over').
   */
  function drive(
    humanInputs?: HumanInputs,
  ): 'awaiting' | 'round-done' | 'game-over' {
    const result = session.step(humanInputs);
    pushState(result.state);
    if (result.log.length > 0) {
      setLog((prev) => {
        const merged = [...prev, ...result.log];
        // Cap retention so long auto-play sessions don't unbounded-grow.
        return merged.length > LOG_RETENTION
          ? merged.slice(merged.length - LOG_RETENTION)
          : merged;
      });
    }

    if (result.status === 'awaiting') {
      setPending(result.request);
      resetFormsFor(result.request);
      return 'awaiting';
    }
    setPending(null);
    if (isGameOver(result.state)) {
      setOver(true);
      return 'game-over';
    }
    session = createSession(result.state, props.config);
    return 'round-done';
  }

  onMount(() => {
    // For all-bot configurations, leave the initial state visible
    // and wait for the user to press Play. Mixed-control sessions
    // advance until the first awaiting request so the matching
    // input panel appears.
    if (isAllBot()) return;
    drive();
  });

  let autoPlayTimer: ReturnType<typeof setTimeout> | null = null;

  function cancelAutoPlayTimer(): void {
    if (autoPlayTimer !== null) {
      clearTimeout(autoPlayTimer);
      autoPlayTimer = null;
    }
  }

  function tickAutoPlay(): void {
    if (!autoPlayActive() || over() || pending() !== null) {
      setAutoPlayActive(false);
      return;
    }
    const status = drive();
    if (status === 'game-over' || status === 'awaiting') {
      setAutoPlayActive(false);
      return;
    }
    scheduleAutoPlay();
  }

  function scheduleAutoPlay(): void {
    cancelAutoPlayTimer();
    autoPlayTimer = setTimeout(tickAutoPlay, autoPlayDelayMs());
  }

  // React to autoPlayActive transitions: start ticking when turned
  // on; cancel any pending timer when turned off (regardless of
  // whether the user paused or a terminal state ended the loop).
  createEffect(
    on(autoPlayActive, (active) => {
      if (active) {
        scheduleAutoPlay();
      } else {
        cancelAutoPlayTimer();
      }
    }),
  );

  onCleanup(cancelAutoPlayTimer);

  function toggleAutoPlay(): void {
    if (autoPlayActive()) {
      setAutoPlayActive(false);
      return;
    }
    if (over() || pending() !== null) return;
    // Jump back to live before resuming so we don't fork off a
    // history branch.
    setViewIndex(history().length - 1);
    setAutoPlayActive(true);
  }

  function goPrev(): void {
    setViewIndex((idx) => Math.max(0, idx - 1));
  }
  function goNext(): void {
    setViewIndex((idx) => Math.min(history().length - 1, idx + 1));
  }
  function goLive(): void {
    setViewIndex(history().length - 1);
  }
  function jumpToFrame(target: number): void {
    setViewIndex(Math.min(Math.max(0, target), history().length - 1));
  }

  const livingTeams = createMemo(() => listLivingTeams(displayedState()));

  function submitBattle(): void {
    if (isViewingHistory()) return;
    const req = pending();
    if (req?.phase !== 'battle') return;
    const plays = new Map<TeamId, BattlePlay>();
    const selections = battleSelections();
    for (const id of req.humanTeams) {
      const key = selections.get(id) ?? null;
      const team = findTeam(headState(), id);
      const card =
        key === null || team === undefined
          ? null
          : (team.cards.find((c, i) => cardKey(c, i) === key) ?? null);
      plays.set(id, { teamId: id, card });
    }
    drive({ battlePlays: plays });
  }

  function submitMovement(): void {
    if (isViewingHistory()) return;
    const req = pending();
    if (req?.phase !== 'movement') return;
    const moves = new Map<TeamId, TeamMove>();
    const selections = moveSelections();
    for (const id of req.humanTeams) {
      const sel = selections.get(id);
      const team = findTeam(headState(), id);
      if (!sel || team === undefined) continue;
      const card = team.cards.find((c, i) => cardKey(c, i) === sel.cardKey);
      if (card === undefined) continue;
      moves.set(id, {
        teamId: id,
        card,
        intendedFacing: sel.facing,
        gridSwapIndex: sel.slot,
      });
    }
    drive({ teamMoves: moves });
  }

  function submitRevival(): void {
    if (isViewingHistory()) return;
    const req = pending();
    if (req?.phase !== 'revival') return;
    const actions = new Map<TeamId, RevivalAction>();
    const selections = revivalSelections();
    for (const id of req.humanTeams) {
      const type = selections.get(id) ?? 'charge-life';
      actions.set(id, { type });
    }
    drive({ revivalActions: actions });
  }

  return (
    <section class="gameplay-screen" aria-label="Gameplay screen">
      <header class="gameplay-screen__header">
        <div>
          <h1>Game session</h1>
          <p class="gameplay-screen__header-meta">
            Round <strong>{displayedState().round}</strong> · phase{' '}
            <strong>{displayedState().phase}</strong> · deck{' '}
            <strong>{displayedState().deck?.length ?? 0}</strong> · graveyard{' '}
            <strong>{displayedState().graveyard?.length ?? 0}</strong> ·
            forbidden <strong>{displayedState().forbiddenCells.length}</strong>
          </p>
        </div>
        <button
          type="button"
          class="gameplay-screen__menu"
          onClick={toggleDrawer}
          aria-label="Open auxiliary controls"
          aria-expanded={drawerOpen()}
        >
          ☰
        </button>
      </header>

      <GameGrid
        grid={displayedState().grid}
        forbiddenCells={[...displayedState().forbiddenCells]}
        currentPhase={displayedState().phase}
      />

      <section
        aria-label="Surviving teams"
        class="gameplay-screen__teams-section"
      >
        <h2>Teams</h2>
        <ul class="gameplay-screen__teams">
          <For each={livingTeams()}>
            {(team) => (
              <li>
                <article
                  class="gameplay-screen__team"
                  aria-label={`Team ${team.teamNumber}`}
                >
                  <header>
                    <h3>Team {team.teamNumber}</h3>
                    <p>
                      Position: ({team.position.x}, {team.position.y}) · Facing:{' '}
                      {team.facing} · Total life: {teamLife(team)}
                    </p>
                  </header>
                  <Show when={team.gridCards !== undefined}>
                    <fieldset class="gameplay__grid-cards">
                      <legend>Grid cards</legend>
                      <CardFace card={team.gridCards?.[0] as Card} />
                      <CardFace card={team.gridCards?.[1] as Card} />
                    </fieldset>
                  </Show>
                  <Hand
                    cards={[...team.cards]}
                    label={`Team ${team.teamNumber} hand`}
                    faceUp={true}
                  />
                </article>
              </li>
            )}
          </For>
        </ul>
      </section>

      <Show when={pending() !== null && !over() && !isViewingHistory()}>
        <section
          class="gameplay__input gameplay-screen__sheet"
          aria-label={`Phase input — ${pending()?.phase}`}
          role="dialog"
          aria-modal="false"
        >
          <h2>Awaiting input — {pending()?.phase}</h2>

          <Show when={pending()?.phase === 'battle'}>
            <For
              each={(pending() as { humanTeams: readonly TeamId[] }).humanTeams}
            >
              {(teamId) => {
                const team = findTeam(headState(), teamId);
                return (
                  <fieldset>
                    <legend>Team {teamId} — battle play</legend>
                    <label>
                      <input
                        type="radio"
                        name={`battle-${teamId}`}
                        checked={battleSelections().get(teamId) === null}
                        onChange={() => {
                          const next = new Map(battleSelections());
                          next.set(teamId, null);
                          setBattleSelections(next);
                        }}
                      />
                      Forfeit (no card)
                    </label>
                    <For each={team?.cards ?? []}>
                      {(card, index) => {
                        const key = cardKey(card, index());
                        return (
                          <label>
                            <input
                              type="radio"
                              name={`battle-${teamId}`}
                              value={key}
                              checked={battleSelections().get(teamId) === key}
                              onChange={() => {
                                const next = new Map(battleSelections());
                                next.set(teamId, key);
                                setBattleSelections(next);
                              }}
                            />
                            {describeCard(card)}
                          </label>
                        );
                      }}
                    </For>
                  </fieldset>
                );
              }}
            </For>
            <button type="button" onClick={submitBattle}>
              Submit battle plays
            </button>
          </Show>

          <Show when={pending()?.phase === 'movement'}>
            <p>
              Movement attribute:{' '}
              <strong>
                {(pending() as { movementAttribute: string }).movementAttribute}
              </strong>
            </p>
            <For
              each={(pending() as { humanTeams: readonly TeamId[] }).humanTeams}
            >
              {(teamId) => {
                const team = findTeam(headState(), teamId);
                const cards = team?.cards ?? [];
                return (
                  <fieldset>
                    <legend>Team {teamId} — movement play</legend>
                    <label>
                      Card:
                      <select
                        value={moveSelections().get(teamId)?.cardKey ?? ''}
                        onChange={(e) => {
                          const next = new Map(moveSelections());
                          const prev = next.get(teamId);
                          if (prev === undefined) return;
                          next.set(teamId, {
                            ...prev,
                            cardKey: e.currentTarget.value,
                          });
                          setMoveSelections(next);
                        }}
                      >
                        <For each={cards}>
                          {(card, index) => {
                            const key = cardKey(card, index());
                            return (
                              <option value={key}>{describeCard(card)}</option>
                            );
                          }}
                        </For>
                      </select>
                    </label>
                    <label>
                      Facing:
                      <select
                        value={moveSelections().get(teamId)?.facing ?? 'north'}
                        onChange={(e) => {
                          const next = new Map(moveSelections());
                          const prev = next.get(teamId);
                          if (prev === undefined) return;
                          next.set(teamId, {
                            ...prev,
                            facing: e.currentTarget.value as Facing,
                          });
                          setMoveSelections(next);
                        }}
                      >
                        <For each={FACINGS}>
                          {(facing) => <option value={facing}>{facing}</option>}
                        </For>
                      </select>
                    </label>
                    <label>
                      Swap slot:
                      <select
                        value={
                          String(moveSelections().get(teamId)?.slot ?? 0) as
                            | '0'
                            | '1'
                        }
                        onChange={(e) => {
                          const next = new Map(moveSelections());
                          const prev = next.get(teamId);
                          if (prev === undefined) return;
                          next.set(teamId, {
                            ...prev,
                            slot: Number(e.currentTarget.value) as 0 | 1,
                          });
                          setMoveSelections(next);
                        }}
                      >
                        <option value="0">0</option>
                        <option value="1">1</option>
                      </select>
                    </label>
                  </fieldset>
                );
              }}
            </For>
            <button type="button" onClick={submitMovement}>
              Submit moves
            </button>
          </Show>

          <Show when={pending()?.phase === 'revival'}>
            <For
              each={(pending() as { humanTeams: readonly TeamId[] }).humanTeams}
            >
              {(teamId) => (
                <fieldset>
                  <legend>Team {teamId} — revival</legend>
                  <For each={REVIVAL_ACTIONS}>
                    {(actionType) => (
                      <label>
                        <input
                          type="radio"
                          name={`revival-${teamId}`}
                          value={actionType}
                          checked={
                            revivalSelections().get(teamId) === actionType
                          }
                          onChange={() => {
                            const next = new Map(revivalSelections());
                            next.set(teamId, actionType);
                            setRevivalSelections(next);
                          }}
                        />
                        {actionType}
                      </label>
                    )}
                  </For>
                </fieldset>
              )}
            </For>
            <button type="button" onClick={submitRevival}>
              Submit revival
            </button>
          </Show>
        </section>
      </Show>

      <Show when={isViewingHistory()}>
        <section
          class="gameplay__history-banner"
          aria-label="History view banner"
        >
          <p>
            <em>Viewing history. Jump to live to continue making inputs.</em>
          </p>
        </section>
      </Show>

      <Show when={over()}>
        <section aria-label="Game over" class="gameplay__game-over">
          <h2>Game over</h2>
          <Show
            when={winnerOf(headState()) !== null}
            fallback={<p>No winner — all teams eliminated or stalemate.</p>}
          >
            <p>
              Winner: <strong>Team {winnerOf(headState())}</strong>
            </p>
          </Show>
        </section>
      </Show>

      <TurnLog entries={[...log()]} />

      <Show when={drawerOpen()}>
        <button
          type="button"
          class="gameplay-screen__drawer-scrim"
          aria-label="Close auxiliary controls"
          onClick={closeDrawer}
        />
        <aside class="gameplay-screen__drawer" aria-label="Auxiliary controls">
          <header class="gameplay-screen__drawer-header">
            <h2>Controls</h2>
            <button
              type="button"
              class="gameplay-screen__drawer-close"
              onClick={closeDrawer}
              aria-label="Close"
            >
              ×
            </button>
          </header>

          <section
            class="gameplay-screen__drawer-section"
            aria-label="State history"
          >
            <h3>History</h3>
            <p>
              Frame <strong>{viewIndex() + 1}</strong> / {history().length}
              <Show when={isViewingHistory()}>
                {' '}
                — <em>viewing history</em>
              </Show>
            </p>
            <div class="gameplay-screen__drawer-controls">
              <button
                type="button"
                onClick={goPrev}
                disabled={viewIndex() === 0}
              >
                ← Previous
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={viewIndex() >= history().length - 1}
              >
                Next →
              </button>
              <button
                type="button"
                onClick={goLive}
                disabled={!isViewingHistory()}
                aria-label="Jump to live"
              >
                Jump to live
              </button>
            </div>
            <label>
              Frame:
              <input
                type="range"
                min="0"
                max={history().length - 1}
                value={viewIndex()}
                onInput={(e) => jumpToFrame(Number(e.currentTarget.value))}
                aria-label="History timeline"
              />
            </label>
          </section>

          <Show when={isAllBot()}>
            <section
              class="gameplay-screen__drawer-section"
              aria-label="Auto-play controls"
            >
              <h3>Auto-play</h3>
              <div class="gameplay-screen__drawer-controls">
                <button
                  type="button"
                  onClick={toggleAutoPlay}
                  disabled={over() || isViewingHistory()}
                >
                  {autoPlayActive() ? 'Pause' : 'Play'}
                </button>
              </div>
              <label>
                Delay (ms):
                <input
                  type="range"
                  min={MIN_AUTOPLAY_DELAY_MS}
                  max={MAX_AUTOPLAY_DELAY_MS}
                  step="50"
                  value={autoPlayDelayMs()}
                  onInput={(e) =>
                    setAutoPlayDelayMs(Number(e.currentTarget.value))
                  }
                  aria-label="Auto-play delay milliseconds"
                />
                <output>{autoPlayDelayMs()}</output>
              </label>
            </section>
          </Show>
        </aside>
      </Show>
    </section>
  );
}
