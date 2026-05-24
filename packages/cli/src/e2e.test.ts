import {
  createSession,
  DEFAULT_CONFIG,
  ELEMENT_AXIS,
  isGameOver,
  type LogEntry,
  type RoundState,
  randomStrategy,
  setupGame,
  type TeamControl,
  type TeamId,
} from '@kurone-kito/oneiron-core';
import { describe, expect, it } from 'vitest';

/**
 * Behavioural end-to-end coverage that complements the unit
 * tests in `packages/core` and the aggregate-outcome tests in
 * `batch.test.ts`. Each `it(...)` asserts one engine-side
 * invariant by driving real games via `createSession` +
 * `randomStrategy` and inspecting per-state snapshots.
 *
 * No spawned processes, no full Vite build — the suite stays
 * well under the issue's 5-second budget.
 */

function allBotControls(
  initial: RoundState,
  strategySeed: number,
): ReadonlyMap<TeamId, TeamControl> {
  const controls = new Map<TeamId, TeamControl>();
  for (const x of ELEMENT_AXIS) {
    for (const y of ELEMENT_AXIS) {
      for (const team of initial.grid[x][y]) {
        controls.set(team.teamNumber, {
          type: 'bot',
          strategy: randomStrategy(strategySeed + team.teamNumber),
        });
      }
    }
  }
  return controls;
}

function snapshotPositions(state: RoundState): Map<TeamId, string> {
  const positions = new Map<TeamId, string>();
  for (const x of ELEMENT_AXIS) {
    for (const y of ELEMENT_AXIS) {
      for (const team of state.grid[x][y]) {
        positions.set(team.teamNumber, `${x},${y}`);
      }
    }
  }
  return positions;
}

type RoundFrame = {
  readonly round: number;
  readonly state: RoundState;
  readonly log: readonly LogEntry[];
  readonly status: 'awaiting' | 'done';
};

/**
 * Drives an all-bot game by re-creating a session per round
 * (matches how `GameplayScreen` and `runBatch` chain rounds).
 * Captures every per-round state + log so the assertions can
 * inspect the trajectory.
 */
function driveAllBotGame(
  initial: RoundState,
  controls: ReadonlyMap<TeamId, TeamControl>,
  maxRounds = 50,
): RoundFrame[] {
  const frames: RoundFrame[] = [];
  let state = initial;
  let rounds = 0;
  while (rounds < maxRounds && !isGameOver(state)) {
    const session = createSession(state, { controls });
    const step = session.step();
    state = step.state;
    rounds += 1;
    frames.push({
      round: rounds,
      state,
      log: step.log,
      status: step.status,
    });
    if (step.status === 'awaiting') break;
  }
  return frames;
}

describe('end-to-end game flow (all-bot, deterministic seed)', () => {
  it('bots actually change grid positions across a 5-round run', () => {
    const initial = setupGame({ playerCount: 6, seed: 7 }, DEFAULT_CONFIG);
    const controls = allBotControls(initial, 0);
    const frames = driveAllBotGame(initial, controls, 5);

    const initialPositions = snapshotPositions(initial);
    const movedAtLeastOnce = new Set<TeamId>();
    for (const frame of frames) {
      const here = snapshotPositions(frame.state);
      for (const [teamId, pos] of here) {
        if (initialPositions.get(teamId) !== pos) {
          movedAtLeastOnce.add(teamId);
        }
      }
    }
    // At least two distinct teams must have moved within five
    // rounds — a single-team move would be consistent with the
    // engine accidentally pinning the rest of the roster.
    expect(movedAtLeastOnce.size).toBeGreaterThanOrEqual(2);
  });

  it('every round emits at least one movement-phase log entry', () => {
    const initial = setupGame({ playerCount: 6, seed: 7 }, DEFAULT_CONFIG);
    const controls = allBotControls(initial, 0);
    const frames = driveAllBotGame(initial, controls, 5);

    for (const frame of frames) {
      const movementLogs = frame.log.filter((e) => e.phase === 'movement');
      expect(
        movementLogs.length,
        `round ${frame.round} produced no movement log entries`,
      ).toBeGreaterThan(0);
    }
  });

  it('movement-resolution log lines report a non-zero count at least once', () => {
    const initial = setupGame({ playerCount: 6, seed: 7 }, DEFAULT_CONFIG);
    const controls = allBotControls(initial, 0);
    const frames = driveAllBotGame(initial, controls, 5);

    const resolutionLines = frames
      .flatMap((f) => f.log)
      .filter((e) => e.phase === 'movement')
      .map((e) => e.message)
      .filter((m) => m.startsWith('Movement resolution:'));
    expect(resolutionLines.length).toBeGreaterThan(0);
    const counts = resolutionLines.map((line) => {
      const match = line.match(/Movement resolution:\s*(\d+)\s*moves/);
      return match ? Number.parseInt(match[1] ?? '0', 10) : 0;
    });
    expect(counts.some((n) => n > 0)).toBe(true);
  });

  it('battle damage occurs at least once across a small batch', () => {
    let sawDamage = false;
    for (let seed = 1; seed <= 5 && !sawDamage; seed += 1) {
      const initial = setupGame({ playerCount: 6, seed }, DEFAULT_CONFIG);
      const controls = allBotControls(initial, seed * 10);
      const frames = driveAllBotGame(initial, controls);
      for (const frame of frames) {
        for (const entry of frame.log) {
          if (entry.phase !== 'battle') continue;
          // The runner-side `battleLogMessage` shape — see
          // `packages/core/src/logic/runner.ts`.
          const hit = entry.message.match(
            /^Team \d+ hit Team \d+ for (\d+) damage/,
          );
          if (hit && Number.parseInt(hit[1] ?? '0', 10) > 0) {
            sawDamage = true;
            break;
          }
        }
        if (sawDamage) break;
      }
    }
    expect(sawDamage).toBe(true);
  });

  it('every game in a small batch terminates within the default cap', () => {
    const MAX_ROUNDS = 50;
    for (let seed = 1; seed <= 5; seed += 1) {
      const initial = setupGame({ playerCount: 6, seed }, DEFAULT_CONFIG);
      const controls = allBotControls(initial, seed * 10);
      const frames = driveAllBotGame(initial, controls, MAX_ROUNDS);
      const last = frames[frames.length - 1];
      expect(last, `seed ${seed} produced no frames at all`).toBeDefined();
      expect(frames.length).toBeLessThanOrEqual(MAX_ROUNDS);
      // Either the game ended (isGameOver) or it ran a positive
      // number of rounds without freezing — both rule out the
      // "stuck at round 0" regression.
      expect(frames.length).toBeGreaterThan(0);
      expect(last?.status).toBe('done');
    }
  });

  it('same inputs produce identical per-round position trajectories', () => {
    const setup = () => {
      const initial = setupGame({ playerCount: 6, seed: 7 }, DEFAULT_CONFIG);
      const controls = allBotControls(initial, 42);
      return driveAllBotGame(initial, controls, 5).map((frame) =>
        Object.fromEntries(snapshotPositions(frame.state)),
      );
    };
    const first = setup();
    const second = setup();
    expect(second).toEqual(first);
  });

  it('revival actions fire at least sometimes across a 20-game sample', () => {
    let sawRevival = false;
    for (let seed = 1; seed <= 20 && !sawRevival; seed += 1) {
      const initial = setupGame({ playerCount: 9, seed }, DEFAULT_CONFIG);
      const controls = allBotControls(initial, seed * 17);
      const frames = driveAllBotGame(initial, controls);
      for (const frame of frames) {
        if (
          frame.log.some(
            (e) => e.phase === 'revival' && /^Team \d+ chose /.test(e.message),
          )
        ) {
          sawRevival = true;
          break;
        }
      }
    }
    // If a future regression makes revival unreachable entirely
    // this should flip — random variance over 20 games is wide
    // enough to keep the assertion stable in CI.
    expect(sawRevival).toBe(true);
  });
});
