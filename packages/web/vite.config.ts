import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [
    solid(),
    VitePWA({
      // The hand-written manifest at public/manifest.webmanifest (see
      // #150) is the source of truth. Disabling the plugin's
      // regeneration keeps the two from drifting.
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
