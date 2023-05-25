import classNames from 'classnames';
import type { FC, PropsWithChildren } from 'react';

export interface CardFaceProps extends PropsWithChildren {
  readonly align?: boolean;

  readonly down?: boolean;
}

export const CardFace: FC<CardFaceProps> = ({ align, children, down }) => (
  <div
    className={classNames('border border-stone-200 card flex flex-col p-1.5', {
      'bg-gradient-to-b from-stone-50 to-indigo-50': down,
      'bg-stone-50': !down,
      'justify-between': align,
      'justify-center': !align,
    })}
  >
    {children}
  </div>
);
