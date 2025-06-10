import { createEffect, on, onCleanup } from 'solid-js';
import { shouldAutoAdvance } from '../game/helpers.mjs';

export type Cleanup = () => void;

/**
 * Schedule automatic phase advancement if allowed.
 * @param phase - Current phase.
 * @param auto - Auto mode flag.
 * @param callback - Called when the delay finishes.
 * @param delay - Timeout in ms.
 * @param set - Timeout scheduler (primarily for tests).
 * @param clear - Timeout clearer (primarily for tests).
 * @returns Cleanup function cancelling the scheduled callback.
 */
export const scheduleAutoAdvance = (
  phase: Parameters<typeof shouldAutoAdvance>[0],
  auto: boolean,
  playing: boolean,
  callback: () => void,
  delay = 2000,
  set: (fn: () => void, delay: number) => number = setTimeout,
  clear: (id: number) => void = clearTimeout,
): Cleanup => {
  if (!shouldAutoAdvance(phase, auto, playing)) return () => {};
  const id = set(callback, delay);
  return () => clear(id);
};

/**
 * SolidJS effect wrapper scheduling automatic advancement.
 * @param phase - Phase accessor.
 * @param auto - Auto mode accessor.
 * @param next - Callback executed when advancing.
 * @param delay - Timeout in ms.
 * @param set - Timeout scheduler.
 * @param clear - Timeout clearer.
 */
export const useAutoAdvance = (
  phase: () => Parameters<typeof shouldAutoAdvance>[0],
  auto: () => boolean,
  playing: () => boolean,
  next: () => void,
  delay = 2000,
  set: (fn: () => void, delay: number) => number = setTimeout,
  clear: (id: number) => void = clearTimeout,
) => {
  createEffect(
    on(
      () => [phase(), auto(), playing()] as const,
      ([p, a, play]) => {
        const cleanup = scheduleAutoAdvance(
          p,
          a,
          play,
          next,
          delay,
          set,
          clear,
        );
        onCleanup(cleanup);
      },
      { defer: true },
    ),
  );
};
