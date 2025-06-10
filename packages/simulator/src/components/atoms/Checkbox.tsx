import type { Component, JSX } from 'solid-js';
import { splitProps } from 'solid-js';
import { twMerge } from 'tailwind-merge';

/** Type definition for Checkbox properties */
export type CheckboxProps = Readonly<JSX.InputHTMLAttributes<HTMLInputElement>>;

/**
 * Checkbox component
 * @param props - Checkbox properties
 * @returns Checkbox input element
 */
export const Checkbox: Component<CheckboxProps> = (props) => {
  const [local, others] = splitProps(props, ['class']);
  return (
    <input
      type="checkbox"
      class={twMerge('checkbox', local.class)}
      {...others}
    />
  );
};
