import type { Component } from 'solid-js';
import { For, Show, createMemo } from 'solid-js';
import { createBoardCells } from '../../board.mjs';
import type { CardType, Team } from '../../types.mjs';
import { BoardCell } from '../molecules/BoardCell.js';

/** Type definition for GameBoard properties. */
export interface GameBoardProps {
  readonly grid: (CardType | null)[][];
  readonly teams: Pick<
    Team,
    'id' | 'position' | 'direction' | 'isEliminated' | 'gridCards'
  >[];
}

/**
 * Map active team positions for quick lookup.
 * @param props - The properties containing the game grid and teams.
 * @returns Map of team positions as keys and team id and direction as values.
 */
export const GameBoard: Component<GameBoardProps> = (props) => {
  const cells = createMemo(() => createBoardCells(props.grid, props.teams));
  return (
    <div data-testid="game-board" class="overflow-auto">
      <div class="grid grid-cols-5 gap-1">
        <For each={cells()}>
          {(row) => (
            <For each={row}>
              {(c) => (
                <Show
                  fallback={<BoardCell card={c.card} />}
                  keyed
                  when={c.team}
                >
                  {(team) => <BoardCell card={c.card} team={team} />}
                </Show>
              )}
            </For>
          )}
        </For>
      </div>
    </div>
  );
};
