import type { Component, JSX } from 'solid-js';
import { splitProps } from 'solid-js';
import { twMerge } from 'tailwind-merge';

/** Type definition for Toggle properties */
export type ToggleProps = Readonly<JSX.InputHTMLAttributes<HTMLInputElement>>;

/**
 * Toggle switch component using DaisyUI classes.
 * @param props - Toggle properties
 * @returns Checkbox input styled as a toggle
 */
export const Toggle: Component<ToggleProps> = (props) => {
  const [local, others] = splitProps(props, ['class']);
  return (
    <input type="checkbox" class={twMerge('toggle', local.class)} {...others} />
  );
};
