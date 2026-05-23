import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import solid from 'vite-plugin-solid';

// Subpath-aware base. `WEB_BASE` defaults to `/` so `pnpm dev`
// and `pnpm preview` keep working unchanged; the GitHub Pages
// deploy workflow (#161) sets `WEB_BASE=/oneiron/` so asset
// URLs in `dist/index.html`, the precache manifest, and the
// registered service-worker scope all resolve under the
// project-Pages subpath.
const base = process.env['WEB_BASE'] ?? '/';

export default defineConfig({
  base,
  plugins: [
    solid(),
    VitePWA({
      // The hand-written manifest at public/manifest.webmanifest (see
      // #150) is the source of truth. Disabling the plugin's
      // regeneration keeps the two from drifting; the manifest uses
      // relative URLs for `start_url` / `scope` / `icons[].src` so it
      // auto-adapts to whatever base path the host serves it from.
      manifest: false,
      // 'prompt' surfaces an "Update available" affordance through
      // the registerSW callback so the user opts into refresh.
      registerType: 'prompt',
      injectRegister: 'auto',
      workbox: {
        // Precache the built shell. Gameplay logic is bundled, so
        // offline visits just need the static assets to be cached
        // ahead of time.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
