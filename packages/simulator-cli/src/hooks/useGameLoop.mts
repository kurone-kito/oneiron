import { createSimpleBotAgent } from '@kurone-kito/oneiron-bot-simple';
import {
  type Game,
  type Id,
  createDeck,
  createGame,
  createPlayer,
  createTeam,
  drawCard,
  shuffle,
  stepGame,
} from '@kurone-kito/oneiron-core';
import { useEffect, useState } from 'react';

const createInitialGame = (playerCount: number): Game => {
  const deck = shuffle(createDeck());
  let rest: typeof deck = deck;
  const agents: Record<Id, ReturnType<typeof createSimpleBotAgent>> = {};
  const teams = Array.from({ length: playerCount }).map((_, i) => {
    const [p, ...next] = rest as [
      Parameters<typeof drawCard>[1],
      ...typeof deck,
    ];
    rest = next as typeof deck;
    const player = drawCard(createPlayer(), p);
    const agent = createSimpleBotAgent();
    agents[player.id] = agent;
    const team = createTeam(
      [player],
      { id: `n${i + 1}` as Id, type: 'number', value: i + 1 },
      {
        x: (i % 5) as 0 | 1 | 2 | 3 | 4,
        y: Math.floor(i / 5) as 0 | 1 | 2 | 3 | 4,
      },
      'north',
    );
    return team;
  });
  return createGame(teams, agents, rest);
};

export const useGameLoop = (playerCount: number) => {
  const [game, setGame] = useState<Game>(() => createInitialGame(playerCount));
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      setLogs((l) => [...l, `フェーズ:${game.state.phase}`]);
      const next = await stepGame(game);
      setGame(next);
      if (next.state.round > 10 || next.state.teams.length < 2) return;
      setTimeout(run, 500);
    };
    const id = setTimeout(run, 500);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [game]);

  return { game, logs } as const;
};
