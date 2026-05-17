import type { Card } from '@kurone-kito/oneiron-core';

const ELEMENT_SYMBOL: Record<string, string> = {
  fire: '🔥',
  water: '💧',
  wood: '🌿',
};

type Props = {
  card: Card;
};

export function CardFace(props: Props) {
  const { card } = props;

  if (card.kind === 'joker') {
    return (
      <div class="card card--joker" role="img" aria-label="Joker">
        <span class="card__symbol">★</span>
        <span class="card__label">Joker</span>
      </div>
    );
  }

  const symbol = ELEMENT_SYMBOL[card.element] ?? card.element;
  const label = `${card.element} ${card.value}`;

  return (
    <div class={`card card--${card.element}`} role="img" aria-label={label}>
      <span class="card__symbol">{symbol}</span>
      <span class="card__value">{card.value}</span>
    </div>
  );
}
