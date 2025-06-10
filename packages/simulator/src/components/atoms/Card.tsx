import type { Component } from 'solid-js';
import { splitProps } from 'solid-js';
import { twMerge } from 'tailwind-merge';
import type { AttributeCard, CardType } from '../../types.mjs';
import { getAttributeEmoji } from '../../utils/emoji.mjs';

/** Type definition for Card properties. */
export interface CardProps {
  /** Card information to display. */
  readonly card: CardType;

  /** Rotation angle in degrees. */
  readonly angle?: number;

  /** Additional class names. */
  readonly class?: string;

  /** Additional properties to spread onto the card element. */
  readonly classList?: Record<string, boolean>;
}

/**
 * Display a single card with optional rotation.
 * @param props - The properties for the card component.
 * @returns JSX element representing the card.
 */
export const Card: Component<CardProps> = (props) => {
  const [local, others] = splitProps(props, ['class', 'card', 'angle']);
  const isAttribute = (c: CardType): c is AttributeCard =>
    c.type === 'attribute';
  const attr = () =>
    isAttribute(local.card) ? getAttributeEmoji(local.card.attribute) : '🃏';
  const rank = () => (isAttribute(local.card) ? local.card.number : '');
  const style = () => `rotate(${local.angle ?? 0}deg)`;
  return (
    <div
      class={twMerge(
        'card border-2 border-neutral w-12 h-20 bg-base-100 shadow',
        local.class,
      )}
      style={{ transform: style() }}
      {...others}
    >
      <div class="flex flex-col items-center justify-center text-xl h-full">
        <span>{attr()}</span>
        <span>{rank()}</span>
      </div>
    </div>
  );
};
