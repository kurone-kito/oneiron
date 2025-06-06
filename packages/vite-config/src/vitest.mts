import type { ViteUserConfig } from 'vitest/config';
import { mergeConfig } from 'vitest/config';
import type { ViteConfigOptions } from './vite.mjs';
import { viteConfig } from './vite.mjs';

/**
 * Create a Vitest configuration for the current project.
 *
 * The entry point is `src/index.mts` under the provided working directory.
 * If the file starts with a shebang(`#!...`), the build uses library mode;
 * otherwise it performs an SSR build. Additional settings can override
 * these defaults via {@link mergeConfig}.
 * @param overrides Additional configuration options to merge with the base
 * config.
 * @param options Options for creating the config, including the working
 * directory.
 * @return A Vitest {@link ViteUserConfig} object with the merged
 * configuration.
 */
export const vitestConfig = (
  overrides: ViteUserConfig = {},
  options: ViteConfigOptions = {},
): ViteUserConfig =>
  mergeConfig(
    { test: { environment: 'node' } } as const satisfies ViteUserConfig,
    viteConfig(overrides, options),
  );
