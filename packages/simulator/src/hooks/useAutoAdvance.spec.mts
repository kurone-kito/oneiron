import { describe, expect, it, vi } from 'vitest';
import { scheduleAutoAdvance } from './useAutoAdvance.mjs';

const phase = 'battle' as const;

describe('scheduleAutoAdvance', () => {
  it('calls callback when auto enabled and playing', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    scheduleAutoAdvance(phase, true, true, cb, 1000);
    vi.runAllTimers();
    expect(cb).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('returns noop when auto or playing disabled', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const cleanup = scheduleAutoAdvance(phase, false, true, cb, 1000);
    vi.runAllTimers();
    expect(cb).not.toHaveBeenCalled();
    cleanup();
    vi.useRealTimers();
  });

  it('returns noop when playing disabled', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const cleanup = scheduleAutoAdvance(phase, true, false, cb, 1000);
    vi.runAllTimers();
    expect(cb).not.toHaveBeenCalled();
    cleanup();
    vi.useRealTimers();
  });
});
