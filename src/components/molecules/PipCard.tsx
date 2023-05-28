import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faDroplet } from '@fortawesome/free-solid-svg-icons/faDroplet';
import { faFire } from '@fortawesome/free-solid-svg-icons/faFire';
import { faTree } from '@fortawesome/free-solid-svg-icons/faTree';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import type { FC } from 'react';
import type { Rank, Suit } from '../../types/card';
import { CardFace } from '../atoms/CardFace';
import { RankLabel } from '../atoms/RankLabel';

export interface PipCardProps {
  readonly rank: Rank;

  readonly suit: Suit;
}

const suitMap = {
  fire: [faFire, 'text-red-300'],
  tree: [faTree, 'text-green-300'],
  water: [faDroplet, 'text-sky-300'],
} as const satisfies Record<Suit, readonly [IconDefinition, string]>;

export const PipCard: FC<PipCardProps> = ({ rank, suit }) => {
  const [icon, color] = suitMap[suit];
  return (
    <CardFace align>
      <div className="card-text-pip-rank transition-transform rotate-180">
        <RankLabel>{rank}</RankLabel>
        <span className="text-xs text-stone-200">▼</span>
        <RankLabel>{rank}</RankLabel>
      </div>
      <FontAwesomeIcon icon={icon} className={classNames('text-4xl', color)} />
      <div className="card-text-pip-rank">
        <RankLabel>{rank}</RankLabel>
        <span className="text-xs text-stone-200">▲</span>
        <RankLabel>{rank}</RankLabel>
      </div>
    </CardFace>
  );
};
