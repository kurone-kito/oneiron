import type { FC } from 'react';
import type { JokerCardProps, PipCardProps } from './Card';
import { Card } from './Card';

export interface StockProps {
  readonly cards: readonly (JokerCardProps | PipCardProps)[];
}

export const Stock: FC<StockProps> = ({ cards }) => (
  <div className="flex items-center justify-center">
    {cards.map((card, i) => (
      <div className="-mr-8" key={i}>
        <Card selectOnHover {...card} />
      </div>
    ))}
  </div>
);
