/**
 * Collect log messages while forwarding them to a provided callback.
 *
 * @param logger - Callback invoked on each added message.
 * @returns An object with `log` and `getLogs` functions.
 */
export const createLogCollector = (
  logger: (msg: string) => void = () => {},
): {
  readonly log: (msg: string) => void;
  readonly getLogs: () => string[];
} => {
  const buffer: string[] = [];
  const log = (msg: string) => {
    buffer.push(msg);
    logger(msg);
  };
  return { log, getLogs: () => [...buffer] } as const;
};
