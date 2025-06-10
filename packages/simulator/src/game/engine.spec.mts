import { describe, expect, it, vi } from 'vitest';
import type { CardType, Team } from '../types.mjs';
import type { TeamUpdate } from './engine.mjs';
import {
  applyTeamUpdates,
  areTeamsAdjacent,
  findEncounterPairs,
  resolveEncounters,
  resolvePairs,
  simulateBattle,
  simulatePairs,
} from './engine.mjs';
import { createLogCollector } from './logCollector.mjs';

const makeTeam = (
  id: number,
  cards: CardType[],
  pos = { x: 0, y: 0 },
): Team => ({
  id,
  players: [
    {
      id: `p${id}`,
      name: `P${id}`,
      isBot: false,
      life: 3,
      isAlive: true,
      cards: [...cards],
    },
  ],
  position: pos,
  direction: 'north',
  gridCards: [],
  isEliminated: false,
});

describe('simulateBattle', () => {
  it('reduces life according to card advantage', () => {
    const t1 = makeTeam(1, [
      { attribute: 'fire', number: 1, type: 'attribute' },
    ]);
    const t2 = makeTeam(2, [
      { attribute: 'wood', number: 1, type: 'attribute' },
    ]);
    const logs: string[] = [];
    const discards: CardType[] = [];
    const { teams } = simulateBattle(
      t1,
      t2,
      (m) => logs.push(m),
      (c) => discards.push(c),
    );
    expect(teams[0].players[0]?.life).toBe(3);
    expect(teams[1].players[0]?.life).toBe(2);
    expect(logs.some((l) => l.includes('チーム1の勝利'))).toBe(true);
  });

  it('handles lack of cards', () => {
    const t1 = makeTeam(1, []);
    const t2 = makeTeam(2, [
      { attribute: 'fire', number: 1, type: 'attribute' },
    ]);
    const logs: string[] = [];
    const { teams } = simulateBattle(
      t1,
      t2,
      (m) => logs.push(m),
      () => {},
    );
    expect(teams[0].players[0]?.life).toBe(2);
    expect(logs.some((l) => l.includes('カード不足'))).toBe(true);
  });
});

describe('findEncounterPairs', () => {
  it('pairs teams in adjacent cells', () => {
    const t1 = makeTeam(1, [], { x: 0, y: 0 });
    const t2 = makeTeam(2, [], { x: 0, y: 1 });
    const t3 = makeTeam(3, [], { x: 2, y: 2 });
    const pairs = findEncounterPairs([t1, t2, t3]);
    expect(pairs).toEqual([[t1, t2]]);
  });

  it('does not mutate the input array', () => {
    const t1 = makeTeam(1, [], { x: 0, y: 0 });
    const t2 = makeTeam(2, [], { x: 0, y: 1 });
    const teams = [t1, t2];
    const snapshot = teams.map((t) => ({ ...t }));
    findEncounterPairs(teams);
    expect(teams).toEqual(snapshot);
  });
});

describe('areTeamsAdjacent', () => {
  it('detects adjacency correctly', () => {
    const a = makeTeam(1, [], { x: 0, y: 0 });
    const b = makeTeam(2, [], { x: 0, y: 1 });
    const c = makeTeam(3, [], { x: 2, y: 2 });
    expect(areTeamsAdjacent(a, b)).toBe(true);
    expect(areTeamsAdjacent(a, c)).toBe(false);
  });
});

describe('resolveEncounters', () => {
  it('updates teams and aggregates logs', () => {
    const t1 = makeTeam(
      1,
      [{ attribute: 'fire', number: 1, type: 'attribute' }],
      { x: 0, y: 0 },
    );
    const t2 = makeTeam(
      2,
      [{ attribute: 'wood', number: 1, type: 'attribute' }],
      { x: 0, y: 1 },
    );
    const logs: string[] = [];
    const { teams, logs: out } = resolveEncounters([t1, t2], (m) =>
      logs.push(m),
    );
    expect(teams[1]?.players[0]?.life).toBe(2);
    expect(t2.players[0]?.life).toBe(3);
    expect(logs.length).toBeGreaterThan(0);
    expect(out.length).toBe(logs.length);
  });

  it('uses injected helpers', () => {
    const pairs = vi.fn().mockReturnValue([]);
    const sim = vi.fn();
    resolveEncounters([], () => {}, { findPairs: pairs, simulate: sim });
    expect(pairs).toHaveBeenCalled();
    expect(sim).not.toHaveBeenCalled();
  });
});

describe('resolvePairs', () => {
  it('updates teams and logs encounters', () => {
    const clones = [
      makeTeam(1, [{ attribute: 'fire', number: 1, type: 'attribute' }], {
        x: 0,
        y: 0,
      }),
      makeTeam(2, [{ attribute: 'wood', number: 1, type: 'attribute' }], {
        x: 0,
        y: 1,
      }),
    ];
    const { log, getLogs } = createLogCollector(() => {});
    const updated = resolvePairs(
      clones,
      [[clones[0] as Team, clones[1] as Team]],
      simulateBattle,
      log,
      () => {},
    );
    expect(updated[1]?.players[0]?.life).toBe(2);
    expect(clones[1]?.players[0]?.life).toBe(3);
    expect(getLogs().length).toBeGreaterThan(0);
  });
});

describe('applyTeamUpdates', () => {
  it('replaces matching teams while preserving order', () => {
    const t1 = makeTeam(1, [], { x: 0, y: 0 });
    const t2 = makeTeam(2, [], { x: 1, y: 0 });
    const updates: TeamUpdate[] = [[1, { ...t1, isEliminated: true }]];
    const result = applyTeamUpdates([t1, t2], updates);
    expect(result[0]?.isEliminated).toBe(true);
    expect(result[1]).toBe(t2);
  });
});

describe('simulatePairs', () => {
  it('delegates simulation to helper and collects updates', () => {
    const t1 = makeTeam(1, [], { x: 0, y: 0 });
    const t2 = makeTeam(2, [], { x: 1, y: 0 });
    const simulate = vi.fn().mockReturnValue({ teams: [t1, t2], logs: [] });
    const updates = simulatePairs(
      [[t1, t2]],
      simulate,
      () => {},
      () => {},
    );
    expect(simulate).toHaveBeenCalledWith(
      t1,
      t2,
      expect.any(Function),
      expect.any(Function),
    );
    expect(updates.length).toBe(2);
    expect(updates[0]?.[0]).toBe(1);
    expect(updates[1]?.[0]).toBe(2);
  });
});
