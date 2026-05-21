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
import { createMemo, createSignal, For, onMount, Show } from 'solid-js';
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

/**
 * Encodes a card as a stable string key so radio / option groups can
 * round-trip selection through the DOM without aliasing duplicate
 * entries.
 */
function cardKey(card: Card, idx: number): string {
  return card.kind === 'joker'
    ? `joker@${idx}`
    : `${card.element}-${card.value}@${idx}`;
}

export function GameplayScreen(props: GameplayScreenProps) {
  let session = createSession(props.initialState, props.config);

  const [state, setState] = createSignal<RoundState>(props.initialState);
  const [pending, setPending] = createSignal<HumanInputRequest | null>(null);
  // The session does not currently surface phase-by-phase log entries;
  // the TurnLog renders an empty list until a logging hook is added in
  // a follow-up issue. Keeping the signal in place so the JSX wiring is
  // ready for that future work.
  const [log] = createSignal<readonly LogEntry[]>([]);
  const [over, setOver] = createSignal(false);

  // Form state for the awaiting phase — keyed by team id.
  const [battleSelections, setBattleSelections] = createSignal<
    ReadonlyMap<TeamId, string | null>
  >(new Map());
  const [moveSelections, setMoveSelections] = createSignal<
    ReadonlyMap<TeamId, { cardKey: string; facing: Facing; slot: 0 | 1 }>
  >(new Map());
  const [revivalSelections, setRevivalSelections] = createSignal<
    ReadonlyMap<TeamId, RevivalAction['type']>
  >(new Map());

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
        for (const id of request.humanTeams) next.set(id, null); // null = forfeit
        setBattleSelections(next);
        break;
      }
      case 'movement': {
        const next = new Map<
          TeamId,
          { cardKey: string; facing: Facing; slot: 0 | 1 }
        >();
        for (const id of request.humanTeams) {
          const team = findTeam(state(), id);
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

  /** Drives the session until it either awaits input or the game ends. */
  function drive(humanInputs?: HumanInputs): void {
    let iterations = 0;
    let inputs = humanInputs;
    while (iterations < 200) {
      iterations += 1;
      const result = session.step(inputs);
      inputs = undefined;
      setState(result.state);

      if (result.status === 'awaiting') {
        setPending(result.request);
        resetFormsFor(result.request);
        return;
      }
      // status === 'done'
      setPending(null);
      if (isGameOver(result.state)) {
        setOver(true);
        return;
      }
      // Start next round with a fresh session over the same controls.
      session = createSession(result.state, props.config);
    }
    // Safety net — should not be reached in practice.
    console.error('[GameplayScreen] drive() bailed out after 200 iterations');
  }

  onMount(() => {
    drive();
  });

  const livingTeams = createMemo(() => listLivingTeams(state()));

  function submitBattle(): void {
    const req = pending();
    if (req?.phase !== 'battle') return;
    const plays = new Map<TeamId, BattlePlay>();
    const selections = battleSelections();
    for (const id of req.humanTeams) {
      const key = selections.get(id) ?? null;
      const team = findTeam(state(), id);
      const card =
        key === null || team === undefined
          ? null
          : (team.cards.find((c, i) => cardKey(c, i) === key) ?? null);
      plays.set(id, { teamId: id, card });
    }
    drive({ battlePlays: plays });
  }

  function submitMovement(): void {
    const req = pending();
    if (req?.phase !== 'movement') return;
    const moves = new Map<TeamId, TeamMove>();
    const selections = moveSelections();
    for (const id of req.humanTeams) {
      const sel = selections.get(id);
      const team = findTeam(state(), id);
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
    <section aria-label="Gameplay screen">
      <header class="gameplay__header">
        <h1>Game session</h1>
        <p>
          Round <strong>{state().round}</strong>, phase{' '}
          <strong>{state().phase}</strong>
        </p>
        <p>
          Deck: <strong>{state().deck?.length ?? 0}</strong> · Graveyard:{' '}
          <strong>{state().graveyard?.length ?? 0}</strong> · Forbidden cells:{' '}
          <strong>{state().forbiddenCells.length}</strong>
        </p>
      </header>

      <GameGrid
        grid={state().grid}
        forbiddenCells={[...state().forbiddenCells]}
        currentPhase={state().phase}
      />

      <section aria-label="Surviving teams">
        <h2>Teams</h2>
        <For each={livingTeams()}>
          {(team) => (
            <article
              class="gameplay__team"
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
          )}
        </For>
      </section>

      <Show when={pending() !== null && !over()}>
        <section
          class="gameplay__input"
          aria-label={`Phase input — ${pending()?.phase}`}
        >
          <h2>Awaiting input — {pending()?.phase}</h2>

          <Show when={pending()?.phase === 'battle'}>
            <For
              each={(pending() as { humanTeams: readonly TeamId[] }).humanTeams}
            >
              {(teamId) => {
                const team = findTeam(state(), teamId);
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
                const team = findTeam(state(), teamId);
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

      <Show when={over()}>
        <section aria-label="Game over" class="gameplay__game-over">
          <h2>Game over</h2>
          <Show
            when={winnerOf(state()) !== null}
            fallback={<p>No winner — all teams eliminated or stalemate.</p>}
          >
            <p>
              Winner: <strong>Team {winnerOf(state())}</strong>
            </p>
          </Show>
        </section>
      </Show>

      <TurnLog entries={[...log()]} />
    </section>
  );
}
