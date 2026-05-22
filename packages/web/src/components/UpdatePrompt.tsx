import { createSignal, onMount, Show } from 'solid-js';
import { loadRegisterSW, type RegisterSW } from './sw-register.ts';

export type { RegisterCallbacks, RegisterSW } from './sw-register.ts';

export type UpdatePromptProps = {
  /**
   * Test seam — defaults to the plugin's `virtual:pwa-register`
   * module resolved at runtime by `loadRegisterSW`.
   */
  readonly registerSW?: RegisterSW;
};

export function UpdatePrompt(props: UpdatePromptProps) {
  const [needRefresh, setNeedRefresh] = createSignal(false);
  const [offlineReady, setOfflineReady] = createSignal(false);
  let updateFn: ((reload?: boolean) => Promise<void>) | null = null;

  onMount(async () => {
    const registerSW = props.registerSW ?? (await loadRegisterSW());
    updateFn = registerSW({
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => setOfflineReady(true),
    });
  });

  function handleUpdate(): void {
    setNeedRefresh(false);
    updateFn?.(true).catch(() => undefined);
  }

  function dismissOffline(): void {
    setOfflineReady(false);
  }

  return (
    <>
      <Show when={needRefresh()}>
        <div
          class="update-prompt update-prompt--refresh"
          role="status"
          aria-live="polite"
          aria-label="Update available"
        >
          <p>A new version of Dream Duels is available.</p>
          <button
            type="button"
            class="update-prompt__action"
            onClick={handleUpdate}
          >
            Update
          </button>
        </div>
      </Show>
      <Show when={offlineReady() && !needRefresh()}>
        <div
          class="update-prompt update-prompt--offline"
          role="status"
          aria-live="polite"
          aria-label="Offline ready"
        >
          <p>Ready to play offline.</p>
          <button
            type="button"
            class="update-prompt__action"
            onClick={dismissOffline}
          >
            Dismiss
          </button>
        </div>
      </Show>
    </>
  );
}
