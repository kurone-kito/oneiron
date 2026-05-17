import solidPlugin from 'vite-plugin-solid';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [solidPlugin()],
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
