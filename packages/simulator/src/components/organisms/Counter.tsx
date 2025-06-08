import { createSignal } from 'solid-js';
import type { Component } from 'solid-js';

/**
 * A simple counter component.
 * @returns The component.
 */
export const Counter: Component = () => {
  const [count, setCount] = createSignal(0);
  const increment = () => setCount((c) => c + 1);
  return (
    <button class="btn" type="button" onClick={increment}>
      Count: {count()}
    </button>
  );
};
