import classNames from 'classnames';
import type { FC } from 'react';
import * as R from 'remeda';
import { DownCard } from './DownCard';

export interface DeckProps {
  readonly length: number;
}

export const Deck: FC<DeckProps> = ({ length }) => (
  <div className="flex flex-col items-center">
    <div className="card-root m-2">
      {R.range(0, Math.min(length, 3)).map((i) => (
        <div
          className={classNames('absolute', {
            'left-0 top-0': i === 0,
            'left-1 top-1': i === 1,
            'left-2 top-2': i === 2,
          })}
          key={i}
        >
          <DownCard />
        </div>
      ))}
    </div>
    <div className="text-sm text-gray-400">{length}</div>
  </div>
);
