import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import shebangRegex from 'shebang-regex';
import type { BuildEnvironmentOptions, UserConfig } from 'vite';
import { mergeConfig } from 'vite';
import dts from 'vite-plugin-dts';

/** Type definition for options used when creating a Vite configuration. */
export interface ViteConfigOptions {
  /**
   * Base directory of the target project.
   * @default process.cwd()
   */
  readonly cwd?: string | undefined;
}

/** The name of the output file. */
const out = '[name].mjs';

/** The directory where the source files are located. */
export const srcDir = 'src';

/** The Rollup options for the Vite build. */
const rollupOptions = {
  output: { chunkFileNames: out, entryFileNames: out, format: 'es' },
} as const satisfies BuildEnvironmentOptions['rollupOptions'];

/**
 * Creates a Vite configuration based on the provided entry point.
 *
 * The entry point is `src/index.mts` under the provided working directory.
 * If the file starts with a shebang(`#!...`), the build uses library mode;
 * otherwise it performs an SSR build.
 * @param entry The entry point file to use for the Vite configuration.
 * @return A Vite {@link UserConfig} object with the configuration
 */
const innerCreateConfig = (entry: string): UserConfig => {
  if (!existsSync(entry)) {
    return {};
  }
  const bin = shebangRegex.test(readFileSync(entry, 'utf8'));
  return {
    build: {
      rollupOptions: { input: entry, ...rollupOptions },
      sourcemap: true,
      ssr: true,
      target: 'es2023',
      ...(bin ? {} : { lib: { entry, formats: ['es'] } }),
    },
    plugins: bin ? [] : [dts({ exclude: ['**/*.spec.mts'] })],
  };
};

/**
 * Create a Vite configuration for the current project.
 *
 * The entry point is `src/index.mts` under the provided working directory.
 * If the file starts with a shebang(`#!...`), the build uses library mode;
 * otherwise it performs an SSR build. Additional settings can override
 * these defaults via {@link mergeConfig}.
 * @param overrides Additional configuration options to merge with the base
 * config.
 * @param options Options for creating the config, including the working
 * directory.
 * @return A Vite {@link UserConfig} object with the merged configuration.
 */
export const viteConfig = (
  overrides: UserConfig = {},
  options: ViteConfigOptions = {},
): UserConfig => {
  const { cwd = process.cwd() } = options;
  const entry = resolve(cwd, srcDir, 'index.mts');
  return mergeConfig(innerCreateConfig(entry), overrides);
};
