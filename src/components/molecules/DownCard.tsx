import { faMoon } from '@fortawesome/free-solid-svg-icons/faMoon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FC } from 'react';
import { CardFace } from '../atoms/CardFace';

export const DownCard: FC = () => (
  <CardFace down>
    <FontAwesomeIcon icon={faMoon} className="text-5xl text-indigo-100" />
    <p className="font-thin text-center text-stone-500 text-xs tracking-wide">
      ONEIRON
    </p>
  </CardFace>
);
