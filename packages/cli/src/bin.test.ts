import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const BIN_PATH = resolve(here, '..', 'dist', 'cli.js');

function runBin(args: readonly string[]): { stdout: string; status: number } {
  try {
    const stdout = execFileSync('node', [BIN_PATH, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { stdout, status: 0 };
  } catch (error) {
    const err = error as { stdout?: Buffer | string; status?: number };
    return {
      stdout:
        typeof err.stdout === 'string'
          ? err.stdout
          : err.stdout
            ? err.stdout.toString('utf8')
            : '',
      status: err.status ?? 1,
    };
  }
}

describe('bin/oneiron (compiled dist/cli.js)', () => {
  beforeAll(() => {
    // The `prepare` hook builds dist/ on `pnpm install`, so the bin
    // should be present whenever the test suite runs. Surface a clear
    // message if it isn't, instead of a confusing ENOENT later.
    if (!existsSync(BIN_PATH)) {
      throw new Error(
        `dist/cli.js not found at ${BIN_PATH}. Run \`pnpm -F @kurone-kito/oneiron-cli run build\` first.`,
      );
    }
  });

  it('prints batch JSON for a deterministic seed', () => {
    const { stdout, status } = runBin([
      'batch',
      '--player-count',
      '4',
      '--games',
      '2',
      '--seed-start',
      '1',
    ]);
    expect(status).toBe(0);
    const parsed = JSON.parse(stdout) as {
      summary: { games: number };
      outcomes: readonly { seed: number }[];
    };
    expect(parsed.outcomes).toHaveLength(2);
    expect(parsed.outcomes.map((o) => o.seed)).toEqual([1, 2]);
    expect(parsed.summary.games).toBe(2);
  });

  it('honours --format markdown', () => {
    const { stdout, status } = runBin([
      'batch',
      '--player-count',
      '4',
      '--games',
      '1',
      '--seed-start',
      '1',
      '--format',
      'markdown',
    ]);
    expect(status).toBe(0);
    expect(stdout).toContain('# Batch summary');
    expect(stdout).toContain('## Win rates by team number');
  });

  it('honours --format csv', () => {
    const { stdout, status } = runBin([
      'batch',
      '--player-count',
      '4',
      '--games',
      '1',
      '--seed-start',
      '1',
      '--format',
      'csv',
    ]);
    expect(status).toBe(0);
    const lines = stdout.trimEnd().split('\n');
    expect(lines[0]).toBe(
      'seed,winner,rounds,survivingTeams,totalDamageDealt,graveyardSize,soloTeams',
    );
    expect(lines).toHaveLength(2);
  });

  it('writes to --output instead of stdout', () => {
    const dir = mkdtempSync(join(tmpdir(), 'oneiron-bin-'));
    const file = join(dir, 'report.json');
    try {
      const { stdout, status } = runBin([
        'batch',
        '--player-count',
        '4',
        '--games',
        '2',
        '--seed-start',
        '1',
        '--output',
        file,
      ]);
      expect(status).toBe(0);
      expect(stdout).toBe('');
      const parsed = JSON.parse(readFileSync(file, 'utf8')) as {
        outcomes: unknown[];
      };
      expect(parsed.outcomes).toHaveLength(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('prints the help text when invoked with --help', () => {
    const { stdout, status } = runBin(['--help']);
    expect(status).toBe(0);
    expect(stdout).toContain('Usage:');
    expect(stdout).toContain('batch');
    expect(stdout).toContain('--format');
  });
});
