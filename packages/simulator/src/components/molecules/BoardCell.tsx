import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import type { CardType, Team } from '../../types.mjs';
import { getDirectionAngle } from '../../utils/direction.mjs';
import { Card } from '../atoms/Card.js';

/** Type definition for BoardCell properties */
export interface BoardCellProps {
  readonly card: CardType | null;

  readonly team?: Pick<Team, 'direction' | 'id' | 'gridCards'>;
}

/**
 * Display a single cell of the game board.
 * @param props - Properties for the board cell
 * @returns A component representing a board cell
 */
export const BoardCell: Component<BoardCellProps> = (props) => (
  <div
    data-testid="grid-cell"
    class="w-16 h-24 flex items-center justify-center bg-base-200"
  >
    <Show
      when={props.team?.gridCards && props.team.gridCards.length > 0}
      fallback={
        <Show keyed when={props.card}>
          {(card) => (
            <div class="relative">
              <Card
                card={card}
                angle={getDirectionAngle(props.team?.direction)}
              />
              <Show keyed when={props.team}>
                {(team) => (
                  <span class="absolute -top-2 -right-2 badge badge-primary badge-xs">
                    {team.id}
                  </span>
                )}
              </Show>
            </div>
          )}
        </Show>
      }
    >
      <div class="relative">
        <For each={props.team?.gridCards ?? []}>
          {(c) => (
            <Card
              card={c}
              angle={getDirectionAngle(props.team?.direction)}
              class="absolute"
            />
          )}
        </For>
        <Show keyed when={props.team}>
          {(team) => (
            <span class="absolute -top-2 -right-2 badge badge-primary badge-xs">
              {team.id}
            </span>
          )}
        </Show>
      </div>
    </Show>
  </div>
);
