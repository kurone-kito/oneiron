import { faFaceGrinTongueWink } from '@fortawesome/free-solid-svg-icons/faFaceGrinTongueWink';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FC } from 'react';
import { CardFace } from '../atoms/CardFace';

export const JokerCard: FC = () => (
  <CardFace align>
    <p className="card-text-joker rotate-180">JOKER</p>
    <FontAwesomeIcon
      icon={faFaceGrinTongueWink}
      className="text-5xl text-pink-400"
    />
    <p className="card-text-joker">JOKER</p>
  </CardFace>
);
