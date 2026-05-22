// Thin re-export of vite-plugin-pwa's `registerSW`. Lives in its
// own module so tests can swap it via `vi.mock(...)` without
// pulling Workbox into the test environment.
//
// In production builds the plugin replaces the
// `virtual:pwa-register` import at transform time; in dev / test
// it can be unresolvable, so the dynamic import is wrapped in a
// try/catch that returns a no-op fallback.

export type RegisterCallbacks = {
  readonly onNeedRefresh?: () => void;
  readonly onOfflineReady?: () => void;
};

export type RegisterSW = (
  callbacks: RegisterCallbacks,
) => (reload?: boolean) => Promise<void>;

const NOOP_REGISTER: RegisterSW = () => async () => undefined;

export async function loadRegisterSW(): Promise<RegisterSW> {
  // Variable specifier prevents Vite's static import-analysis from
  // trying to resolve `virtual:pwa-register` outside production
  // builds. At build time the plugin still rewrites the dynamic
  // import via its load hook so the real module is bundled.
  const specifier = 'virtual:pwa-register';
  try {
    const mod = (await import(/* @vite-ignore */ specifier)) as {
      registerSW?: RegisterSW;
    };
    if (typeof mod.registerSW === 'function') {
      return mod.registerSW;
    }
  } catch {
    // Module unavailable (dev / vitest environments): fall through.
  }
  return NOOP_REGISTER;
}
