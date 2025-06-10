/**
 * Format a log message with timestamp.
 * @param msg - Log body.
 * @param now - Date factory (for tests).
 * @returns Timestamped log string.
 */
export const formatLog = (
  msg: string,
  now: () => Date = () => new Date(),
): string => `[${now().toLocaleTimeString()}] ${msg}`;
