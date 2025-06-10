import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import type { CardType } from '../../types.mjs';
import { getVisibleCards } from '../../utils/card.mjs';
import { Card } from '../atoms/Card.js';

/** Properties for {@link PlayerStatus}. */
export interface PlayerStatusProps {
  readonly player: {
    readonly name: string;
    readonly life: number;
    readonly isAlive: boolean;
    readonly cards: readonly CardType[];
  };
}

/**
 * Display player's status and cards.
 *
 * @param props - {@link PlayerStatusProps}
 * @returns JSX element showing player info.
 */
export const PlayerStatus: Component<PlayerStatusProps> = (props) => {
  const { visibleCards, hiddenCount } = getVisibleCards(props.player.cards);
  return (
    <div class="border-2 border-amber-400">
      <div>
        {props.player.name}: ❤️{props.player.life}
        <Show when={!props.player.isAlive}>
          <br />
          <span class="text-error-content"> (脱落)</span>
        </Show>
      </div>
      <div class="flex">
        <For each={visibleCards}>
          {(card, i) => <Card card={card} classList={{ '-ml-5': !!i() }} />}
        </For>
        <Show when={!!hiddenCount}>
          <div classList={{ '-ml-5': !!visibleCards.length }}>
            <div class="card w-12 h-20 bg-base-100 shadow flex items-center justify-center">
              ？x{hiddenCount}
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};
