import {
  type Card,
  DEFAULT_CONFIG,
  type ElementCard,
  type LifeToken,
  type RoundState,
  randomStrategy,
  type SessionConfig,
  setupGame,
  type TeamControl,
  type TeamId,
  type TeamState,
} from '@kurone-kito/oneiron-core';
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameplayScreen } from './GameplayScreen.tsx';

afterEach(cleanup);

const fire5: ElementCard = { kind: 'element', element: 'fire', value: 5 };
const water3: ElementCard = { kind: 'element', element: 'water', value: 3 };
const wood1: ElementCard = { kind: 'element', element: 'wood', value: 1 };
const wood4: ElementCard = { kind: 'element', element: 'wood', value: 4 };

function botConfigFor(initial: RoundState, seed = 0): SessionConfig {
  const controls = new Map<TeamId, TeamControl>();
  for (const x of ['fire', 'water', 'wood'] as const) {
    for (const y of ['fire', 'water', 'wood'] as const) {
      for (const team of initial.grid[x][y]) {
        controls.set(team.teamNumber, {
          type: 'bot',
          strategy: randomStrategy(seed + team.teamNumber),
        });
      }
    }
  }
  return { controls, gameConfig: DEFAULT_CONFIG };
}

function makeTeam(opts: {
  id: TeamId;
  position: { x: 'fire' | 'water' | 'wood'; y: 'fire' | 'water' | 'wood' };
  life?: number;
  cards?: readonly Card[];
  gridCards?: readonly [Card, Card];
}): TeamState {
  return {
    teamNumber: opts.id,
    position: opts.position,
    facing: 'north',
    cards: opts.cards ?? [],
    gridCards: opts.gridCards ?? [fire5, water3],
    players: [{ life: (opts.life ?? 2) as LifeToken }],
  };
}

function stateWith(teams: readonly TeamState[]): RoundState {
  const emptyRow = { fire: [], water: [], wood: [] } as const;
  let grid: RoundState['grid'] = {
    fire: emptyRow,
    water: emptyRow,
    wood: emptyRow,
  } as RoundState['grid'];
  for (const team of teams) {
    const { x, y } = team.position;
    grid = {
      ...grid,
      [x]: { ...grid[x], [y]: [...grid[x][y], team] },
    } as RoundState['grid'];
  }
  return {
    phase: 'battle',
    round: 1,
    grid,
    forbiddenCells: [],
    deck: [],
    graveyard: [],
    droppedLifeTokens: {
      fire: { fire: 0, water: 0, wood: 0 },
      water: { fire: 0, water: 0, wood: 0 },
      wood: { fire: 0, water: 0, wood: 0 },
    },
  };
}

describe('GameplayScreen', () => {
  it('renders header with round and phase', () => {
    const initial = setupGame({ playerCount: 4, seed: 1 }, DEFAULT_CONFIG);
    const config = botConfigFor(initial);
    render(() => <GameplayScreen initialState={initial} config={config} />);
    expect(screen.getByRole('heading', { name: 'Game session' })).toBeTruthy();
    expect(screen.getByLabelText(/game grid .* phase/i)).toBeTruthy();
  });

  it('all-bot session advances rounds without prompting for input', () => {
    const initial = setupGame({ playerCount: 4, seed: 5 }, DEFAULT_CONFIG);
    const config = botConfigFor(initial, 100);
    render(() => <GameplayScreen initialState={initial} config={config} />);
    // No phase input panel should be visible because no humans control teams.
    expect(screen.queryByLabelText(/phase input/i)).toBeNull();
  });

  it('populates the turn log after the user submits a battle round', () => {
    const teamA = makeTeam({
      id: 1 as TeamId,
      position: { x: 'fire', y: 'water' },
      life: 3,
      cards: [wood1],
      gridCards: [fire5, water3],
    });
    const teamB = makeTeam({
      id: 2 as TeamId,
      position: { x: 'fire', y: 'water' },
      life: 3,
      cards: [wood4],
      gridCards: [wood1, wood4],
    });
    const initial = stateWith([teamA, teamB]);
    const controls = new Map<TeamId, TeamControl>([
      [1 as TeamId, { type: 'human' }],
      [2 as TeamId, { type: 'human' }],
    ]);
    render(() => (
      <GameplayScreen
        initialState={initial}
        config={{ controls, gameConfig: DEFAULT_CONFIG }}
      />
    ));
    fireEvent.click(
      screen.getByRole('button', { name: 'Submit battle plays' }),
    );
    const turnLog = screen.getByLabelText('Turn log');
    // After one battle resolution + revival, the log should hold at
    // least the battle outcome line.
    expect(turnLog.textContent ?? '').toMatch(
      /Team \d+ (hit Team \d+|drew with Team \d+)/,
    );
  });

  it('pauses for human battle play and advances the round on submit', () => {
    // Two-team battle on the same cell, both human, both have no cards
    // → forfeit. After both submit, the draw advances to the next round
    // (battle panel reappears for round 2 with both still awaiting).
    const teamA = makeTeam({
      id: 1 as TeamId,
      position: { x: 'fire', y: 'water' },
      life: 3,
      cards: [wood1],
      gridCards: [fire5, water3],
    });
    const teamB = makeTeam({
      id: 2 as TeamId,
      position: { x: 'fire', y: 'water' },
      life: 3,
      cards: [wood4],
      gridCards: [wood1, wood4],
    });
    const initial = stateWith([teamA, teamB]);
    const controls = new Map<TeamId, TeamControl>([
      [1 as TeamId, { type: 'human' }],
      [2 as TeamId, { type: 'human' }],
    ]);
    render(() => (
      <GameplayScreen
        initialState={initial}
        config={{ controls, gameConfig: DEFAULT_CONFIG }}
      />
    ));
    expect(screen.getByLabelText(/phase input — battle/i)).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Submit battle plays' }),
    );
    // Both forfeit → draw → round completes and a new round begins.
    // The round counter should now read >= 2. Round is rendered as
    // <strong>{round}</strong> alongside text, so search via the
    // header's textContent.
    const heading = screen.getByRole('heading', { name: 'Game session' });
    const header = heading.parentElement;
    expect(header?.textContent).toMatch(/round\s*2/i);
  });

  it('renders surviving teams with their hand and grid cards', () => {
    const initial = setupGame({ playerCount: 4, seed: 1 }, DEFAULT_CONFIG);
    const config = botConfigFor(initial);
    render(() => <GameplayScreen initialState={initial} config={config} />);
    const teamArticle = screen.queryAllByLabelText(/^Team \d+$/);
    expect(teamArticle.length).toBeGreaterThan(0);
  });

  it('keeps the initial state visible for all-bot sessions until Play', () => {
    const initial = setupGame({ playerCount: 4, seed: 7 }, DEFAULT_CONFIG);
    const config = botConfigFor(initial, 50);
    render(() => <GameplayScreen initialState={initial} config={config} />);
    // No auto-advance: history holds exactly the initial frame.
    const historySection = screen.getByLabelText('State history');
    expect(historySection.textContent ?? '').toMatch(/Frame\s*1\s*\/\s*1/);
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
  });

  it('auto-play advances rounds and pauses when the user clicks Pause', async () => {
    vi.useFakeTimers();
    try {
      const initial = setupGame({ playerCount: 4, seed: 11 }, DEFAULT_CONFIG);
      const config = botConfigFor(initial, 60);
      render(() => <GameplayScreen initialState={initial} config={config} />);
      const play = screen.getByRole('button', { name: 'Play' });
      fireEvent.click(play);
      // Default delay is 200ms; flush a few ticks worth.
      await vi.advanceTimersByTimeAsync(1000);
      const pause = screen.getByRole('button', { name: 'Pause' });
      fireEvent.click(pause);
      // After pausing, more than one frame should have accumulated.
      const historySection = screen.getByLabelText('State history');
      expect(historySection.textContent ?? '').not.toMatch(
        /Frame\s*1\s*\/\s*1/,
      );
      expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('history navigation moves between frames and re-enables live mode', async () => {
    vi.useFakeTimers();
    try {
      const initial = setupGame({ playerCount: 4, seed: 13 }, DEFAULT_CONFIG);
      const config = botConfigFor(initial, 80);
      render(() => <GameplayScreen initialState={initial} config={config} />);
      fireEvent.click(screen.getByRole('button', { name: 'Play' }));
      await vi.advanceTimersByTimeAsync(800);
      fireEvent.click(screen.getByRole('button', { name: 'Pause' }));

      const prev = screen.getByRole('button', { name: /Previous/ });
      fireEvent.click(prev);
      expect(screen.getByLabelText('History view banner')).toBeTruthy();

      const jumpToLive = screen.getByRole('button', { name: 'Jump to live' });
      fireEvent.click(jumpToLive);
      expect(screen.queryByLabelText('History view banner')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('hides phase input panels when viewing a historical frame', () => {
    const teamA = makeTeam({
      id: 1 as TeamId,
      position: { x: 'fire', y: 'water' },
      life: 3,
      cards: [wood1],
      gridCards: [fire5, water3],
    });
    const teamB = makeTeam({
      id: 2 as TeamId,
      position: { x: 'fire', y: 'water' },
      life: 3,
      cards: [wood4],
      gridCards: [wood1, wood4],
    });
    const initial = stateWith([teamA, teamB]);
    const controls = new Map<TeamId, TeamControl>([
      [1 as TeamId, { type: 'human' }],
      [2 as TeamId, { type: 'human' }],
    ]);
    render(() => (
      <GameplayScreen
        initialState={initial}
        config={{ controls, gameConfig: DEFAULT_CONFIG }}
      />
    ));
    expect(screen.getByLabelText(/phase input — battle/i)).toBeTruthy();
    // Step back into history — submit a turn first so there's a
    // prior frame to revisit.
    fireEvent.click(
      screen.getByRole('button', { name: 'Submit battle plays' }),
    );
    fireEvent.click(screen.getByRole('button', { name: /Previous/ }));
    expect(screen.queryByLabelText(/phase input — battle/i)).toBeNull();
    expect(screen.getByLabelText('History view banner')).toBeTruthy();
  });
});
