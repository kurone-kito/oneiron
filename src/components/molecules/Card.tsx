import classNames from 'classnames';
import type { FC } from 'react';
import type { Direction } from '../../types/card';
import { DownCard } from './DownCard';
import { JokerCard } from './JokerCard';
import type { PipCardProps as BasePipCardProps } from './PipCard';
import { PipCard } from './PipCard';

interface CommonCardProps {
  readonly direction?: Direction;

  readonly down?: boolean;

  readonly floated?: boolean;

  readonly selectOnHover?: boolean;
}

export interface JokerCardProps {
  readonly joker: true;
}

export interface PipCardProps extends BasePipCardProps {
  readonly joker?: false;
}

export type CardProps = CommonCardProps & (JokerCardProps | PipCardProps);

const rotateByDirection = {
  down: 'rotate-z-180',
  up: 'rotate-z-0',
  left: '-rotate-z-90',
  right: 'rotate-z-90',
} as const satisfies Record<Direction, string>;

export const Card: FC<CardProps> = ({
  direction = 'up',
  down,
  floated,
  selectOnHover,
  ...props
}) => {
  const containerClassName = classNames({
    'shadow-sm': !floated,
    'scale3d-125 shadow-lg': floated,
  });
  return (
    <div
      className={classNames(
        'card-root duration-500 transform-gpu transition-all',
        { 'cursor-pointer top-0 hover:-top-10': selectOnHover },
        rotateByDirection[direction]
      )}
    >
      <div
        className={classNames(containerClassName, 'card-container', {
          '-rotate-y-180': !down,
          'rotate-t-0': down,
        })}
      >
        <DownCard />
      </div>
      <div
        className={classNames(containerClassName, 'card-container', {
          'rotate-y-180': down,
          'rotate-y-0': !down,
        })}
      >
        {props.joker ? <JokerCard /> : <PipCard {...props} />}
      </div>
    </div>
  );
};
