import type { Component, JSX } from 'solid-js';
import { splitProps } from 'solid-js';
import { twMerge } from 'tailwind-merge';

/** Type definition for Button properties */
export type ButtonProps = Readonly<JSX.ButtonHTMLAttributes<HTMLButtonElement>>;

/**
 * Button component
 * @param props - Button properties
 * @returns Button element
 */
export const Button: Component<ButtonProps> = (props) => {
  const [local, others] = splitProps(props, ['class']);
  return (
    <button
      class={twMerge('btn btn-primary', local.class)}
      type="button"
      {...others}
    >
      {props.children}
    </button>
  );
};
