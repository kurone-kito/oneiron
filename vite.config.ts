import { default as viteReact } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export default defineConfig({ plugins: [viteReact()] });
