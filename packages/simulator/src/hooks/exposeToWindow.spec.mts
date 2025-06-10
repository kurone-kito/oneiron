import { describe, expect, it, vi } from 'vitest';
import { exposeToWindow } from './exposeToWindow.mjs';

declare global {
  interface Window {
    __test?: unknown;
  }
}

describe('exposeToWindow', () => {
  it('assigns and cleans global value', () => {
    const set = vi.fn();
    const del = vi.fn();
    const cleanup = exposeToWindow('__test', 123, set, del);
    expect(set).toHaveBeenCalledWith('__test', 123);
    cleanup();
    expect(del).toHaveBeenCalledWith('__test');
  });
});
