import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faBars } from '@fortawesome/free-solid-svg-icons/faBars';
import { faBell } from '@fortawesome/free-solid-svg-icons/faBell';
import { faBomb } from '@fortawesome/free-solid-svg-icons/faBomb';
import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { faCloud } from '@fortawesome/free-solid-svg-icons/faCloud';
import { faComment } from '@fortawesome/free-solid-svg-icons/faComment';
import { faDownload } from '@fortawesome/free-solid-svg-icons/faDownload';
import { faFile } from '@fortawesome/free-solid-svg-icons/faFile';
import { faFilter } from '@fortawesome/free-solid-svg-icons/faFilter';
import { faGhost } from '@fortawesome/free-solid-svg-icons/faGhost';
import { faHeart } from '@fortawesome/free-solid-svg-icons/faHeart';
import { faHippo } from '@fortawesome/free-solid-svg-icons/faHippo';
import { faHouse } from '@fortawesome/free-solid-svg-icons/faHouse';
import { faImage } from '@fortawesome/free-solid-svg-icons/faImage';
import { faMusic } from '@fortawesome/free-solid-svg-icons/faMusic';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons/faPaperclip';
import { faPhone } from '@fortawesome/free-solid-svg-icons/faPhone';
import { faPoo } from '@fortawesome/free-solid-svg-icons/faPoo';
import { faStar } from '@fortawesome/free-solid-svg-icons/faStar';
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FC } from 'react';

export interface TeamIconProps {
  readonly iconIndex: number;
}

const iconMap = [
  faHouse,
  faUser,
  faCheck,
  faDownload,
  faImage,
  faPhone,
  faBars,
  faStar,
  faMusic,
  faHeart,
  faBomb,
  faPoo,
  faCloud,
  faComment,
  faHippo,
  faPaperclip,
  faFile,
  faBell,
  faFilter,
  faGhost,
] as const satisfies readonly IconDefinition[];

export const TeamIcon: FC<TeamIconProps> = ({ iconIndex }) => (
  <span className="flex justify-center items-center w-10 h-10 rounded-full bg-gray-200">
    <FontAwesomeIcon
      icon={iconMap[iconIndex] ?? faGhost}
      className="text-3xl text-emerald-500"
    />
  </span>
);
