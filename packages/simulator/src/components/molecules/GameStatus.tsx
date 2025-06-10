import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { getPhaseName } from '../../phaseNames.mjs';
import type { GameState } from '../../types.mjs';
import { countAliveTeams } from '../../utils/team.mjs';
import { Button } from '../atoms/Button.js';

/** Type definition for GameStatus properties */
export interface GameStatusProps {
  readonly deckCount: number;
  readonly graveyardCount: number;
  readonly next: () => void;
  readonly state: Pick<GameState, 'isAutoMode' | 'phase' | 'round' | 'teams'>;
}

/**
 * Display the current game status including phase, round, and number of
 * alive teams.
 * @param props - The properties for the game status component.
 * @returns JSX element representing the game status.
 */
export const GameStatus: Component<GameStatusProps> = (props) => {
  const aliveTeams = () => countAliveTeams(props.state.teams);
  return (
    <div class="card bg-base-300 shadow">
      <div class="card-body p-4">
        <h2 class="card-title text-xl mb-3">ゲーム状況</h2>
        <p>
          <strong>フェーズ:</strong> {getPhaseName(props.state.phase)}
        </p>
        <p>
          <strong>ラウンド:</strong> {props.state.round}
        </p>
        <p>
          <strong>山:</strong> {props.deckCount}
        </p>
        <p>
          <strong>墓場:</strong> {props.graveyardCount}
        </p>
        <p>
          <strong>生存チーム:</strong>
          {aliveTeams()}
        </p>
        <Show
          when={!props.state.isAutoMode && props.state.phase !== 'finished'}
        >
          <Button class="mt-4" onClick={props.next}>
            次のフェーズ
          </Button>
        </Show>
      </div>
    </div>
  );
};
