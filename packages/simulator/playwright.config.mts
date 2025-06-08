import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  webServer: {
    command: 'pnpm --filter @kurone-kito/oneiron-simulator dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
