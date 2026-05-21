#!/usr/bin/env -S node --experimental-strip-types

import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const HELP_TEXT = `oneiron - headless Dream Duels simulator

Usage:
  oneiron [options]

Options:
  -h, --help     Show this help message
  -v, --version  Show the CLI package version`;

const READY_TEXT = 'oneiron-cli ready';
const FALLBACK_VERSION = '0.0.0';
const SAFE_VERSION_PATTERN =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

const options = {
  help: {
    short: 'h',
    type: 'boolean',
  },
  version: {
    short: 'v',
    type: 'boolean',
  },
} as const;

const readPackageVersion = async (): Promise<string> => {
  try {
    const packageUrl = new URL('../package.json', import.meta.url);
    const packageJson = await readFile(packageUrl, 'utf8');
    const parsedPackage = JSON.parse(packageJson) as { version?: string };
    const rawVersion = parsedPackage.version;

    if (typeof rawVersion !== 'string') {
      return FALLBACK_VERSION;
    }

    const sanitizedVersion = [...rawVersion]
      .filter((character) => character >= ' ' && character !== '\u007f')
      .join('');

    if (!SAFE_VERSION_PATTERN.test(sanitizedVersion)) {
      return FALLBACK_VERSION;
    }

    return sanitizedVersion;
  } catch {
    return FALLBACK_VERSION;
  }
};

const readErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

export const runCli = async (
  argv: readonly string[] = process.argv.slice(2),
): Promise<number> => {
  let help = false;
  let version = false;

  try {
    ({
      values: { help = false, version = false },
    } = parseArgs({
      args: [...argv],
      options,
      allowPositionals: false,
    }));
  } catch (error) {
    console.error(readErrorMessage(error));
    console.error('');
    console.error(HELP_TEXT);
    return 1;
  }

  if (help) {
    console.log(HELP_TEXT);
    return 0;
  }

  if (version) {
    console.log(await readPackageVersion());
    return 0;
  }

  console.log(READY_TEXT);
  return 0;
};

const isDirectExecution = (): boolean => {
  const entryPoint = process.argv[1];

  return (
    entryPoint !== undefined &&
    pathToFileURL(entryPoint).href === import.meta.url
  );
};

if (isDirectExecution()) {
  const exitCode = await runCli();
  process.exitCode = exitCode;
}
