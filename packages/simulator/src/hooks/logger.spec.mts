import { describe, expect, it } from 'vitest';
import { formatLog } from './logger.mjs';

describe('formatLog', () => {
  it('prefixes message with current time', () => {
    const mockDate = new Date('2024-01-01T12:34:56');
    const now = () => mockDate;
    const result = formatLog('hello', now);
    expect(result).toBe(`[${mockDate.toLocaleTimeString()}] hello`);
  });
});
