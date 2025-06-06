import type { Coordinate2D, Team } from '@kurone-kito/oneiron-core';
import { Box } from 'ink';
import { BoardCell } from '../atoms/BoardCell.js';

export type BoardGridProps = {
  teams: readonly Team[];
  forbids: ReadonlySet<Coordinate2D>;
};

const arrowMap = {
  east: '➡️',
  west: '⬅️',
  north: '⬆️',
  south: '⬇️',
} as const;

export const BoardGrid = ({ teams, forbids }: BoardGridProps) => {
  const row: [string, string, string, string, string] = [
    '·',
    '·',
    '·',
    '·',
    '·',
  ];
  const cells: [
    [string, string, string, string, string],
    [string, string, string, string, string],
    [string, string, string, string, string],
    [string, string, string, string, string],
    [string, string, string, string, string],
  ] = [[...row], [...row], [...row], [...row], [...row]];
  for (const c of forbids) {
    cells[c.y][c.x] = '🚫';
  }
  for (const t of teams) {
    const symbol = t.token ? `${t.token.value}${arrowMap[t.direction]}` : '?';
    cells[t.coordinate.y][t.coordinate.x] = symbol;
  }
  return (
    <Box flexDirection="column">
      {cells.map((row, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey : stable board order
        <Box key={`row-${i}`}>
          {row.map((s, j) => (
            // biome-ignore lint/suspicious/noArrayIndexKey : stable board order
            <BoardCell key={`c-${i}-${j}`} symbol={s} />
          ))}
        </Box>
      ))}
    </Box>
  );
};
