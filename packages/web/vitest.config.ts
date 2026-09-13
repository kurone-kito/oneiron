import solidPlugin from 'vite-plugin-solid';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // `hot: false` keeps vite-plugin-solid from registering its
  // `/@solid-refresh` HMR runtime module for test runs. HMR is
  // meaningless under a one-shot `vitest run`, and vitest 4's module
  // runner cannot resolve that virtual module id into a `file://` URL
  // on Windows (`pathToFileURL` requires a drive-letter-qualified
  // absolute path there), which crashed every Windows test run after
  // the vitest 3→4 bump (#236).
  plugins: [solidPlugin({ hot: false })],
  resolve: {
    conditions: ['browser'],
  },
  test: {
    environment: 'happy-dom',
    server: {
      deps: {
        inline: ['solid-js', '@solidjs/testing-library'],
      },
    },
  },
});
