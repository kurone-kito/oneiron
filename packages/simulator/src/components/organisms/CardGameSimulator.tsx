import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { createGameController } from '../../game/controller.mjs';
import { useGame } from '../../hooks/useGame.mjs';
import { GameLog } from '../molecules/GameLog.js';
import { GameStatus } from '../molecules/GameStatus.js';
import { RulesOverview } from '../molecules/RulesOverview.js';
import { TeamList } from '../molecules/TeamList.js';
import { GameBoard } from './GameBoard.js';
import { SetupForm } from './SetupForm.js';

declare global {
  interface Window {
    __simulatorGame?: ReturnType<typeof createGameController>;
  }
}

/** Type definition for CardGameSimulator properties. */
export interface CardGameSimulatorProps {
  readonly createController?: () => ReturnType<typeof createGameController>;
}

/**
 * CardGameSimulator component
 * @param props - Properties for the simulator component
 * @returns A SolidJS component that simulates a card game
 */
export const CardGameSimulator: Component<CardGameSimulatorProps> = (props) => {
  const game = useGame({
    create: props.createController ?? createGameController,
  });
  const { state, log, initializeGame, nextPhase, setState } = game;

  /* ------------------------- JSX ---------------------------------- */
  return (
    <div class="max-w-6xl mx-auto p-6 bg-base-100 min-h-screen">
      <div class="card bg-base-200 shadow-lg">
        <div class="card-body p-6">
          <h1 class="text-3xl font-bold text-center mb-6 text-base-content">
            オリジナルカードゲーム シミュレーター (SolidJS)
          </h1>

          {/* ---------- セットアップ ---------- */}
          <Show when={state.phase === 'setup'}>
            <SetupForm
              playerCount={state.currentPlayerCount}
              isAutoMode={state.isAutoMode}
              onPlayerCountChange={(n) => setState('currentPlayerCount', n)}
              onAutoModeChange={(b) => setState('isAutoMode', b)}
              onStart={initializeGame}
            />
          </Show>

          {/* ---------- ゲーム進行中 ---------- */}
          <Show when={state.phase !== 'setup'}>
            <TeamList teams={state.teams} />
          </Show>

          <Show when={state.phase !== 'setup'}>
            <div class="my-6">
              <GameBoard grid={state.grid} teams={state.teams} />
            </div>
          </Show>

          {/* ---------- ゲーム情報 & ログ ---------- */}
          <Show when={state.phase !== 'setup'}>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GameStatus
                state={state}
                deckCount={game.deck().length}
                graveyardCount={game.graveyard().length}
                next={nextPhase}
              />
              <GameLog
                logs={log()}
                isPlaying={state.isPlaying}
                onPlaybackChange={(b) => setState('isPlaying', b)}
              />
            </div>
          </Show>

          {/* ---------- ルール概要 ---------- */}
          <RulesOverview />
        </div>
      </div>
    </div>
  );
};
