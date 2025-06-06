import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { srcDir, viteConfig } from './vite.mjs';

/**
 * Sets up a temporary directory with a Vite entry file.
 * @param entryText The content of the entry file to write.
 * @returns A promise that resolves to the path of the temporary directory.
 */
const setup = async (entryText: string) => {
  const dir = await mkdtemp(join(tmpdir(), 'vite-config-'));
  await mkdir(join(dir, srcDir), { recursive: true });
  await writeFile(join(dir, srcDir, 'index.mts'), entryText);
  return dir;
};

describe('viteConfig', () => {
  let cwd: string;
  let entry: string;
  describe('When detects shebang', () => {
    beforeAll(async () => {
      cwd = await setup('#!/usr/bin/env node\nconsole.log();');
      entry = join(cwd, srcDir, 'index.mts');
    });

    afterAll(async () => {
      await rm(cwd, { recursive: true, force: true });
      cwd = '';
    });

    it('should disable library mode', () =>
      expect(viteConfig({}, { cwd })).not.toHaveProperty('build.lib'));

    it('overrides settings with mergeConfig', () =>
      expect(viteConfig({ build: { outDir: 'out' } }, { cwd })).toHaveProperty(
        'build.outDir',
        'out',
      ));

    it('disables type definition generation', () =>
      expect(viteConfig({}, { cwd })).toHaveProperty('plugins', []));
  });

  describe('When does not detect shebang', () => {
    beforeAll(async () => {
      cwd = await setup('console.log();');
      entry = join(cwd, srcDir, 'index.mts');
    });

    afterAll(async () => {
      await rm(cwd, { recursive: true, force: true });
      cwd = '';
    });

    it('should enable library mode', () =>
      expect(viteConfig({}, { cwd })).toHaveProperty('build.lib', {
        entry,
        formats: ['es'],
      }));

    it('overrides settings with mergeConfig', () =>
      expect(viteConfig({ build: { outDir: 'out' } }, { cwd })).toHaveProperty(
        'build.outDir',
        'out',
      ));

    it('enables type definition generation', () =>
      expect(viteConfig({}, { cwd })).toHaveProperty('plugins', [
        expect.anything(),
      ]));
  });

  describe('When the entry does not exist', () => {
    beforeAll(async () => {
      cwd = await mkdtemp(join(tmpdir(), 'vite-config-')); // no file creation
    });

    afterAll(async () => {
      await rm(cwd, { recursive: true, force: true });
      cwd = '';
    });

    it('returns an empty configuration', () =>
      expect(viteConfig({}, { cwd })).toEqual({}));
  });
});

describe('srcDir', () => {
  it('exports srcDir constant', () => expect(srcDir).toBe('src'));
});
