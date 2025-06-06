import { describe, expect, it } from 'vitest';
import { directions } from '../constants/entities.mjs';
import type { Coordinate2D } from '../types/entities/board.mjs';
import type { Id } from '../types/entities/object.mjs';
import type { NumberToken } from '../types/entities/token.mjs';
import { createPlayer } from './player.mjs';
import { createTeam } from './team.mjs';

const coordinate = { x: 0, y: 0 } as const satisfies Coordinate2D;
const token = {
  id: 't1' as Id,
  type: 'number',
  value: 1,
} as const satisfies NumberToken;

describe('createTeam', () => {
  it('creates team with given params', () => {
    const member = createPlayer();
    const team = createTeam([member], token, coordinate, directions[0]);
    expect(team.members).toEqual([member]);
    expect(team.token).toBe(token);
    expect(team.coordinate).toBe(coordinate);
    expect(team.direction).toBe(directions[0]);
  });
});
