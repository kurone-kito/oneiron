import type { Component, JSX } from 'solid-js';
import { splitProps } from 'solid-js';
import { twMerge } from 'tailwind-merge';

/** Type definition for Select properties */
export type SelectProps = Readonly<JSX.SelectHTMLAttributes<HTMLSelectElement>>;

/**
 * Select component
 * @param props - Select properties
 * @returns Select element
 */
export const Select: Component<SelectProps> = (props) => {
  const [local, others] = splitProps(props, ['children', 'class']);
  return (
    <select class={twMerge('select', local.class)} {...others}>
      {local.children}
    </select>
  );
};
