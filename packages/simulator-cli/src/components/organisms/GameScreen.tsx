import type { Game } from '@kurone-kito/oneiron-core';
import { Box } from 'ink';
import { BoardGrid } from '../molecules/BoardGrid.js';
import { LogPane } from '../molecules/LogPane.js';

export type GameScreenProps = {
  game: Game;
  logs: readonly string[];
};

export const GameScreen = ({ game, logs }: GameScreenProps) => (
  <Box flexDirection="row">
    <LogPane
      logs={logs}
      status={`ラウンド:${game.state.round} フェーズ:${game.state.phase}`}
    />
    <BoardGrid teams={game.state.teams} forbids={game.state.forbids} />
  </Box>
);
