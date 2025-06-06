import { useApp } from 'ink';
import { useState } from 'react';
import { GameScreen } from './components/organisms/GameScreen.js';
import { PlayerSetupModal } from './components/organisms/PlayerSetupModal.js';
import { useGameLoop } from './hooks/useGameLoop.mjs';

export const App = () => {
  const { exit } = useApp();
  const [count, setCount] = useState<number | null>(null);
  const { game, logs } = useGameLoop(count ?? 1);

  if (count === null) {
    const handleSubmit = (v: { playerCount: number; botMode: boolean }) => {
      setCount(v.playerCount);
    };
    return <PlayerSetupModal onSubmit={handleSubmit} />;
  }

  if (game.state.round > 10 || game.state.teams.length < 2) {
    exit();
  }
  return <GameScreen game={game} logs={logs} />;
};
