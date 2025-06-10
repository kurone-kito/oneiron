import { createSignal } from 'solid-js';
import { formatLog } from '../hooks/logger.mjs';

/**
 * Create a reactive store for game logs.
 *
 * @param limit - Maximum number of logs to retain.
 * @returns Tuple of log accessor and log adder.
 */
export const createLogStore = (
  limit = 20,
): readonly [() => string[], (msg: string) => void] => {
  const [log, setLog] = createSignal<string[]>([]);
  const addLog = (msg: string) =>
    setLog((prev) => [...prev.slice(-limit + 1), formatLog(msg)]);
  return [log, addLog] as const;
};
