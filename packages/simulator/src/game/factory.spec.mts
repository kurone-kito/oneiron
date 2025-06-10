import { describe, expect, it } from 'vitest';
import { calculateTeamCount, createPlayer, createTeam } from './factory.mjs';

describe('calculateTeamCount', () => {
  it('rounds up odd player counts', () => {
    expect(calculateTeamCount(5)).toBe(3);
  });
});

describe('createPlayer', () => {
  it('creates human player with correct life', () => {
    const p = createPlayer(0, true, true, 1);
    expect(p.id).toBe('player-0');
    expect(p.name).toBe('あなた');
    expect(p.life).toBe(3);
  });
});

describe('createTeam', () => {
  it('assembles team with players', () => {
    const t = createTeam(1, [createPlayer(0, true, true, 2)]);
    expect(t.id).toBe(1);
    expect(t.players.length).toBe(1);
    expect(t.position).toEqual({ x: 0, y: 0 });
  });
});
