import type { Coordinate2D, Team } from '@kurone-kito/oneiron-core';
import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { BoardGrid } from './BoardGrid.js';

const team = {
  id: 't1',
  members: [],
  token: { id: 'n1', type: 'number', value: 1 },
  coordinate: { x: 0, y: 0 } as Coordinate2D,
  direction: 'north' as const,
};

const forbids = new Set<Coordinate2D>([{ x: 1, y: 1 }]);

describe('BoardGrid', () => {
  it('renders board with team and forbid', () => {
    const { lastFrame } = render(
      <BoardGrid teams={[team as unknown as Team]} forbids={forbids} />,
    );
    const frame = lastFrame();
    expect(frame).toContain('1');
    expect(frame).toContain('🚫');
  });
});
