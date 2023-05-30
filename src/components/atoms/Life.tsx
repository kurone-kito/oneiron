import { faHeart } from '@fortawesome/free-solid-svg-icons/faHeart';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FC } from 'react';
import * as R from 'remeda';

export interface LifeProps {
  readonly life: number;
}

export const Life: FC<LifeProps> = ({ life }) => {
  const clamped = R.clamp(life, { min: 0, max: 4 });
  return (
    <div className="flex justify-center border-2 h-5 rounded w-20">
      {R.range(0, clamped).map((i) => (
        <FontAwesomeIcon
          key={i}
          icon={faHeart}
          className="text-red-300 text-md"
        />
      ))}
    </div>
  );
};
