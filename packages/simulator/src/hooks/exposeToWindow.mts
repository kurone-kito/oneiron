import { onCleanup, onMount } from 'solid-js';

/**
 * Expose a value on the global window object and return a cleanup function.
 * @param key - Window property name.
 * @param value - Value to expose.
 * @param set - Assignment function used primarily for testing.
 * @param del - Delete function used primarily for testing.
 * @returns Cleanup function removing the value.
 */
export const exposeToWindow = (
  key: string,
  value: unknown,
  set: (k: string, v: unknown) => void = (k, v) => {
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>)[k] = v;
    }
  },
  del: (k: string) => void = (k) => {
    if (typeof window !== 'undefined') {
      delete (window as unknown as Record<string, unknown>)[k];
    }
  },
): (() => void) => {
  set(key, value);
  return () => del(key);
};

/**
 * SolidJS hook wrapping {@link exposeToWindow} to manage lifecycle.
 * @param key - Window property name.
 * @param value - Value to expose.
 * @param set - Assignment function for tests.
 * @param del - Delete function for tests.
 */
export const useExposeToWindow = (
  key: string,
  value: unknown,
  set?: (k: string, v: unknown) => void,
  del?: (k: string) => void,
) => {
  let cleanup: () => void;
  onMount(() => {
    cleanup = exposeToWindow(key, value, set, del);
  });
  onCleanup(() => cleanup?.());
};
