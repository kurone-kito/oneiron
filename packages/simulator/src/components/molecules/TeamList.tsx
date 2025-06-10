import type { Component } from 'solid-js';
import { For } from 'solid-js';
import type { Team } from '../../types.mjs';
import { getDirectionEmoji } from '../../utils/emoji.mjs';
import { PlayerStatus } from './PlayerStatus.jsx';

/** Type definition for TeamList properties */
export interface TeamListProps {
  readonly teams: Pick<
    Team,
    'id' | 'isEliminated' | 'position' | 'direction' | 'players'
  >[];
}

/**
 * Display a list of teams with their status, including position, direction,
 * and player details.
 * @param props - The properties for the team list component.
 * @returns JSX element representing the team list.
 */
export const TeamList: Component<TeamListProps> = (props) => (
  <div class="card bg-base-300 shadow">
    <div class="card-body p-4">
      <h2 class="card-title text-xl mb-3">チーム状況</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <For each={props.teams}>
          {(team) => (
            <div
              class="p-3 rounded-md"
              classList={{
                'bg-warning': team.isEliminated,
                'bg-base-300': !team.isEliminated,
              }}
            >
              <div class="flex justify-between items-center">
                <span class="font-medium">
                  チーム{team.id} {getDirectionEmoji(team.direction)}
                </span>
                <span class="text-sm text-base-content">
                  ({team.position.x}, {team.position.y})
                </span>
              </div>
              <div class="mt-1 space-y-3 text-sm">
                <For each={team.players}>
                  {(player) => <PlayerStatus player={player} />}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  </div>
);
