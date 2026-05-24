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
    // History + auto-play live inside the off-canvas drawer; open
    // it to read the frame counter and reach Play.
    fireEvent.click(
      screen.getByRole('button', { name: /Open auxiliary controls/i }),
    );
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
      fireEvent.click(
        screen.getByRole('button', { name: /Open auxiliary controls/i }),
      );
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
      fireEvent.click(
        screen.getByRole('button', { name: /Open auxiliary controls/i }),
      );
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
    // prior frame to revisit. The Previous control lives in the
    // off-canvas drawer; open it before clicking.
    fireEvent.click(
      screen.getByRole('button', { name: 'Submit battle plays' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Open auxiliary controls/i }),
    );
    fireEvent.click(screen.getByRole('button', { name: /Previous/ }));
    expect(screen.queryByLabelText(/phase input — battle/i)).toBeNull();
    expect(screen.getByLabelText('History view banner')).toBeTruthy();
  });

  describe('mobile layout', () => {
    function mixedConfig(): {
      initial: ReturnType<typeof stateWith>;
      controls: Map<TeamId, TeamControl>;
    } {
      const teamA = makeTeam({
        id: 1 as TeamId,
        position: { x: 'fire', y: 'water' },
        life: 3,
        cards: [wood1],
      });
      const teamB = makeTeam({
        id: 2 as TeamId,
        position: { x: 'fire', y: 'water' },
        life: 3,
        cards: [wood4],
      });
      const initial = stateWith([teamA, teamB]);
      const controls = new Map<TeamId, TeamControl>([
        [1 as TeamId, { type: 'human' }],
        [2 as TeamId, { type: 'human' }],
      ]);
      return { initial, controls };
    }

    it('renders the phase input panel as a bottom-sheet dialog when awaiting', () => {
      const { initial, controls } = mixedConfig();
      render(() => (
        <GameplayScreen
          initialState={initial}
          config={{ controls, gameConfig: DEFAULT_CONFIG }}
        />
      ));
      const sheet = screen.getByLabelText(/phase input — battle/i);
      expect(sheet.getAttribute('role')).toBe('dialog');
      expect(sheet.className).toMatch(/gameplay-screen__sheet/);
    });

    it('opens and closes the auxiliary drawer via the hamburger button', () => {
      const initial = setupGame({ playerCount: 4, seed: 21 }, DEFAULT_CONFIG);
      const config = botConfigFor(initial, 200);
      render(() => <GameplayScreen initialState={initial} config={config} />);
      const opener = screen.getByRole('button', {
        name: /Open auxiliary controls/i,
      });
      // Closed by default.
      expect(opener.getAttribute('aria-expanded')).toBe('false');
      expect(screen.queryByLabelText('Auxiliary controls')).toBeNull();
      // Open.
      fireEvent.click(opener);
      expect(screen.getByLabelText('Auxiliary controls')).toBeTruthy();
      expect(opener.getAttribute('aria-expanded')).toBe('true');
      // Close via the in-drawer × button.
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByLabelText('Auxiliary controls')).toBeNull();
    });

    it('drives auto-play from inside the drawer', async () => {
      vi.useFakeTimers();
      try {
        const initial = setupGame({ playerCount: 4, seed: 33 }, DEFAULT_CONFIG);
        const config = botConfigFor(initial, 300);
        render(() => <GameplayScreen initialState={initial} config={config} />);
        fireEvent.click(
          screen.getByRole('button', { name: /Open auxiliary controls/i }),
        );
        // Auto-play section is only visible to all-bot configs.
        expect(screen.getByLabelText('Auto-play controls')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Play' }));
        await vi.advanceTimersByTimeAsync(800);
        const historySection = screen.getByLabelText('State history');
        expect(historySection.textContent ?? '').not.toMatch(
          /Frame\s*1\s*\/\s*1/,
        );
      } finally {
        vi.useRealTimers();
      }
    });

    it('renders bots in new grid cells after auto-play drives several rounds', async () => {
      // Mirrors the engine-side spot-check from #166 / #167: an
      // all-bot session at the same seed should reach the DOM
      // with at least one team chip in a different cell after a
      // handful of rounds. If this assertion fails on `main`,
      // the engine is fine (covered by packages/cli/src/e2e.test.ts)
      // but `GameplayScreen` isn't propagating `displayedState`
      // changes to the rendered `<GameGrid>` — that's the bug
      // the maintainer observed.
      vi.useFakeTimers();
      try {
        const initial = setupGame({ playerCount: 6, seed: 7 }, DEFAULT_CONFIG);
        const config = botConfigFor(initial, 0);
        render(() => <GameplayScreen initialState={initial} config={config} />);

        const snapshotPositions = (): ReadonlyMap<string, string> => {
          const map = new Map<string, string>();
          // Each team chip carries `aria-label="Team N"`; the
          // enclosing `<td>` in `<GameGrid>` carries
          // `aria-label="<x>,<y>"` (optionally suffixed with
          // " (forbidden)"). We walk up to that cell to read
          // the position.
          for (const chip of Array.from(
            document.querySelectorAll('[aria-label^="Team "]'),
          )) {
            const cell = chip.closest('td[aria-label]');
            if (!cell) continue;
            const cellLabel = cell.getAttribute('aria-label') ?? '';
            // Only match cells inside the grid (the team summary
            // cards under "Surviving teams" also use
            // `Team N` aria-labels but live in <article>s).
            if (!/^(fire|water|wood),(fire|water|wood)/.test(cellLabel)) {
              continue;
            }
            map.set(
              chip.getAttribute('aria-label') ?? '',
              cellLabel.replace(/\s*\(forbidden\)$/, ''),
            );
          }
          return map;
        };

        const before = snapshotPositions();
        expect(before.size).toBeGreaterThan(0);

        fireEvent.click(
          screen.getByRole('button', { name: /Open auxiliary controls/i }),
        );
        fireEvent.click(screen.getByRole('button', { name: 'Play' }));
        // Default auto-play delay is 200 ms; allow several rounds.
        await vi.advanceTimersByTimeAsync(1500);
        fireEvent.click(screen.getByRole('button', { name: 'Pause' }));

        const after = snapshotPositions();

        const moved = [...after.entries()].filter(
          ([team, pos]) =>
            before.get(team) !== undefined && before.get(team) !== pos,
        );
        expect(
          moved.length,
          `expected at least one team chip to be in a new cell after auto-play; before=${JSON.stringify([...before])} after=${JSON.stringify([...after])}`,
        ).toBeGreaterThan(0);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
