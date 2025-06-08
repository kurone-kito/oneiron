import { defineConfig } from '@solidjs/start/config';
import tailwindcss from '@tailwindcss/vite';

/** The base URL. */
const baseURL = process.env?.['SIMULATOR_BASE_PATH'];

export default defineConfig({
  server: {
    prerender: { autoSubfolderIndex: false },
    preset: 'githubPages',
    ...(baseURL ? { baseURL } : {}),
  },
  vite: { plugins: [tailwindcss()] },
});
