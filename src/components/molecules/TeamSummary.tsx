import type { FC } from 'react';
import { Life } from '../atoms/Life';
import type { TeamIconProps } from '../atoms/TeamIcon';
import { TeamIcon } from '../atoms/TeamIcon';

export interface TeamSummaryProps extends TeamIconProps {
  readonly life: readonly [number, number];
}

export const TeamSummary: FC<TeamSummaryProps> = ({ life, iconIndex }) => (
  <div className="flex items-center space-x-2">
    <TeamIcon iconIndex={iconIndex} />
    <span className="flex flex-col">
      {life.map((value, i) => (
        <Life key={i} life={value} />
      ))}
    </span>
  </div>
);
