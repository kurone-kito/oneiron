import { describe, expect, it, vi } from 'vitest';
import * as logger from '../hooks/logger.mjs';
import { createLogStore } from './logStore.mjs';

describe('createLogStore', () => {
  it('stores only the latest entries', () => {
    vi.spyOn(logger, 'formatLog').mockImplementation((m) => m);
    const [log, add] = createLogStore(3);
    add('1');
    add('2');
    add('3');
    add('4');
    expect(log()).toEqual(['2', '3', '4']);
  });
});
