import { describe, expect, it, vi } from 'vitest';
import { createLogCollector } from './logCollector.mjs';

describe('createLogCollector', () => {
  it('collects and forwards messages', () => {
    const external = vi.fn();
    const { log, getLogs } = createLogCollector(external);
    log('a');
    log('b');
    expect(getLogs()).toEqual(['a', 'b']);
    expect(external).toHaveBeenCalledTimes(2);
  });
});
