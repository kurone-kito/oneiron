import classNames from 'classnames';
import type { FC } from 'react';
import type { Level, Rank } from '../../types/card';
import { getCardLevel } from '../../utils/card';

export interface RankProps {
  readonly children: Rank;
}

const colorByLevel = {
  0: 'bg-gray-400',
  1: 'bg-indigo-400',
  2: 'bg-purple-500',
  3: 'bg-yellow-500',
  4: 'bg-red-600',
} as const satisfies Record<Level, string>;

export const RankLabel: FC<RankProps> = ({ children }) => (
  <p
    className={classNames(
      'aspect-square flex items-center justify-center rounded text-extrabold text-white text-xs w-4',
      colorByLevel[getCardLevel(children)]
    )}
  >
    {children}
  </p>
);
