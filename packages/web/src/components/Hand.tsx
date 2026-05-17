import type { Card } from '@kurone-kito/oneiron-core';
import { For } from 'solid-js';
import { CardFace } from './CardFace.tsx';

type Props = {
  cards: Card[];
  label: string;
  faceUp: boolean;
};

export function Hand(props: Props) {
  return (
    <section class="hand" aria-label={props.label}>
      <h2 class="hand__label">{props.label}</h2>
      <ul class="hand__cards">
        <For each={props.cards}>
          {(card) => (
            <li class="hand__card">
              {props.faceUp ? (
                <CardFace card={card} />
              ) : (
                <div
                  class="card card--back"
                  role="img"
                  aria-label="Card face down"
                >
                  <span class="card__symbol">?</span>
                </div>
              )}
            </li>
          )}
        </For>
      </ul>
    </section>
  );
}
