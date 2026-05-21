#!/usr/bin/env -S node --experimental-strip-types

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { runBatch } from './batch.ts';
import { formatCsv, formatJson, formatMarkdown, summarise } from './report.ts';

const HELP_TEXT = `oneiron - headless Dream Duels simulator

Usage:
  oneiron [options]
  oneiron batch [batch-options]

Options:
  -h, --help     Show this help message
  -v, --version  Show the CLI package version

Subcommands:
  batch          Run N games and print outcome JSON to stdout

Batch options:
  --player-count <n>      Number of teams (required)
  --games <n>             Number of games to run (required)
  --seed-start <n>        Seed for the first game (default 0)
  --max-rounds <n>        Max rounds per game (default 50)
  --strategy-seed <n>     Base seed for bot strategies (default 0)
  --format <fmt>          Output format: json (default), csv, markdown
  --output <path>         Write to <path> instead of stdout`;

const READY_TEXT = 'oneiron-cli ready';
const FALLBACK_VERSION = '0.0.0';
const SAFE_VERSION_PATTERN =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const DEFAULT_BATCH_SEED_START = 0;
const DEFAULT_BATCH_MAX_ROUNDS = 50;
const DEFAULT_BATCH_STRATEGY_SEED = 0;

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

const batchOptions = {
  'player-count': { type: 'string' },
  games: { type: 'string' },
  'seed-start': { type: 'string' },
  'max-rounds': { type: 'string' },
  'strategy-seed': { type: 'string' },
  format: { type: 'string' },
  output: { type: 'string' },
} as const;

type BatchFormat = 'json' | 'csv' | 'markdown';

function parseFormat(raw: string | undefined): BatchFormat {
  if (raw === undefined) return 'json';
  if (raw === 'json' || raw === 'csv' || raw === 'markdown') return raw;
  throw new Error(
    `Invalid --format value '${raw}'. Expected json, csv, or markdown.`,
  );
}

const readErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

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

const parsePositiveInt = (name: string, raw: string | undefined): number => {
  if (raw === undefined) {
    throw new Error(`Missing required option: --${name}`);
  }
  if (!/^-?\d+$/.test(raw)) {
    throw new Error(`Invalid integer for --${name}: ${raw}`);
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`--${name} must be a positive integer`);
  }
  return value;
};

const parseOptionalInt = (
  name: string,
  raw: string | undefined,
  fallback: number,
): number => {
  if (raw === undefined) return fallback;
  if (!/^-?\d+$/.test(raw)) {
    throw new Error(`Invalid integer for --${name}: ${raw}`);
  }
  return Number.parseInt(raw, 10);
};

const runBatchCommand = async (argv: readonly string[]): Promise<number> => {
  let values: {
    readonly [K in keyof typeof batchOptions]?: string;
  };
  try {
    ({ values } = parseArgs({
      args: [...argv],
      options: batchOptions,
      allowPositionals: false,
    }));
  } catch (error) {
    console.error(readErrorMessage(error));
    console.error('');
    console.error(HELP_TEXT);
    return 1;
  }

  try {
    const playerCount = parsePositiveInt(
      'player-count',
      values['player-count'],
    );
    const gameCount = parsePositiveInt('games', values.games);
    const seedStart = parseOptionalInt(
      'seed-start',
      values['seed-start'],
      DEFAULT_BATCH_SEED_START,
    );
    const maxRoundsPerGame = parsePositiveInt(
      'max-rounds',
      values['max-rounds'] ?? String(DEFAULT_BATCH_MAX_ROUNDS),
    );
    const strategySeed = parseOptionalInt(
      'strategy-seed',
      values['strategy-seed'],
      DEFAULT_BATCH_STRATEGY_SEED,
    );
    const format = parseFormat(values.format);
    const outputPath = values.output;

    const result = runBatch({
      playerCount,
      gameCount,
      seedStart,
      maxRoundsPerGame,
      strategySeed,
    });
    const summary = summarise(result.outcomes);
    let rendered: string;
    switch (format) {
      case 'csv':
        rendered = formatCsv(result.outcomes);
        break;
      case 'markdown':
        rendered = formatMarkdown(summary);
        break;
      default:
        rendered = JSON.stringify({
          summary: JSON.parse(formatJson(summary)),
          outcomes: result.outcomes,
        });
        break;
    }
    if (outputPath !== undefined) {
      await writeFile(outputPath, rendered, 'utf8');
    } else {
      console.log(rendered);
    }
    return 0;
  } catch (error) {
    console.error(readErrorMessage(error));
    return 1;
  }
};

export const runCli = async (
  argv: readonly string[] = process.argv.slice(2),
): Promise<number> => {
  if (argv[0] === 'batch') {
    return await runBatchCommand(argv.slice(1));
  }

  let values: Record<string, boolean | string | undefined>;
  try {
    ({ values } = parseArgs({
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

  if (values['help'] === true) {
    console.log(HELP_TEXT);
    return 0;
  }

  if (values['version'] === true) {
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
