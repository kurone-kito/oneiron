import type { Component } from 'solid-js';
import { For } from 'solid-js';
import { Toggle } from '../atoms/Toggle';

/** Type definition for GameLog properties */
export interface GameLogProps {
  readonly logs: string[];
  readonly isPlaying: boolean;
  readonly onPlaybackChange: (playing: boolean) => void;
}

/**
 * Display the game log with a list of messages.
 * @param props - The properties for the game log component.
 * @returns JSX element representing the game log.
 */
export const GameLog: Component<GameLogProps> = (props) => (
  <div class="col-span-2 mt-6 card bg-base-300 shadow">
    <div class="card-body p-4">
      <h2 class="card-title text-xl mb-3 flex items-center gap-2">
        ゲームログ
        <Toggle
          checked={props.isPlaying}
          onChange={(e) => props.onPlaybackChange(e.currentTarget.checked)}
        />
      </h2>
      <div class="bg-neutral p-3 rounded-md h-48 overflow-y-auto text-sm">
        <For each={props.logs}>
          {(l) => (
            <div class="py-1 border-b last:border-b-0 border-gray-100 text-neutral-content">
              {l}
            </div>
          )}
        </For>
      </div>
    </div>
  </div>
);
