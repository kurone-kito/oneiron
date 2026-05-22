import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RegisterCallbacks, RegisterSW } from './UpdatePrompt.tsx';
import { UpdatePrompt } from './UpdatePrompt.tsx';

afterEach(cleanup);

function fakeRegisterSW(): {
  registerSW: RegisterSW;
  invoke: (callback: keyof RegisterCallbacks) => void;
  updateMock: ReturnType<typeof vi.fn>;
} {
  const stored: { callbacks: RegisterCallbacks | null } = { callbacks: null };
  const updateMock = vi.fn(async () => undefined);
  const registerSW: RegisterSW = (callbacks) => {
    stored.callbacks = callbacks;
    return updateMock;
  };
  return {
    registerSW,
    invoke(callback) {
      stored.callbacks?.[callback]?.();
    },
    updateMock,
  };
}

async function flushOnMount(): Promise<void> {
  // onMount + dynamic-import resolution settle in microtasks.
  await Promise.resolve();
  await Promise.resolve();
}

describe('UpdatePrompt', () => {
  it('renders nothing until the service worker reports an event', async () => {
    const { registerSW } = fakeRegisterSW();
    render(() => <UpdatePrompt registerSW={registerSW} />);
    await flushOnMount();
    expect(screen.queryByLabelText('Update available')).toBeNull();
    expect(screen.queryByLabelText('Offline ready')).toBeNull();
  });

  it('shows the "Update" affordance when onNeedRefresh fires', async () => {
    const harness = fakeRegisterSW();
    render(() => <UpdatePrompt registerSW={harness.registerSW} />);
    await flushOnMount();
    harness.invoke('onNeedRefresh');
    const banner = await screen.findByLabelText('Update available');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('A new version');
    const action = screen.getByRole('button', { name: 'Update' });
    fireEvent.click(action);
    expect(harness.updateMock).toHaveBeenCalledWith(true);
    // After clicking, the banner retracts because needRefresh is reset.
    expect(screen.queryByLabelText('Update available')).toBeNull();
  });

  it('shows the offline-ready confirmation when onOfflineReady fires', async () => {
    const harness = fakeRegisterSW();
    render(() => <UpdatePrompt registerSW={harness.registerSW} />);
    await flushOnMount();
    harness.invoke('onOfflineReady');
    const banner = await screen.findByLabelText('Offline ready');
    expect(banner.textContent).toContain('Ready to play offline');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByLabelText('Offline ready')).toBeNull();
  });

  it('prefers the refresh prompt when both signals are active', async () => {
    const harness = fakeRegisterSW();
    render(() => <UpdatePrompt registerSW={harness.registerSW} />);
    await flushOnMount();
    harness.invoke('onOfflineReady');
    harness.invoke('onNeedRefresh');
    expect(await screen.findByLabelText('Update available')).toBeTruthy();
    expect(screen.queryByLabelText('Offline ready')).toBeNull();
  });
});
