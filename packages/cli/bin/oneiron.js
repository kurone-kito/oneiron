#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const cliPath = resolve(currentDirectory, '../src/cli.ts');

const result = spawnSync(
  process.execPath,
  ['--experimental-strip-types', cliPath, ...process.argv.slice(2)],
  {
    stdio: 'inherit',
  },
);

if (result.error !== undefined) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
