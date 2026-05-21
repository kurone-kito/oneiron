import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runCli } from './cli.ts';

describe('runCli', () => {
  let stdout: string[];
  let stderr: string[];

  beforeEach(() => {
    stdout = [];
    stderr = [];
    vi.spyOn(console, 'log').mockImplementation((value?: unknown) => {
      stdout.push(typeof value === 'string' ? value : String(value));
    });
    vi.spyOn(console, 'error').mockImplementation((value?: unknown) => {
      stderr.push(typeof value === 'string' ? value : String(value));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prints the ready text when no arguments are passed', async () => {
    const code = await runCli([]);
    expect(code).toBe(0);
    expect(stdout.join('\n')).toContain('oneiron-cli ready');
  });

  it('prints help text when --help is passed', async () => {
    const code = await runCli(['--help']);
    expect(code).toBe(0);
    expect(stdout.join('\n')).toContain('Usage:');
    expect(stdout.join('\n')).toContain('batch');
  });

  describe('batch subcommand', () => {
    it('prints JSON with summary and outcomes on success', async () => {
      const code = await runCli([
        'batch',
        '--player-count',
        '4',
        '--games',
        '3',
        '--seed-start',
        '1',
      ]);
      expect(code).toBe(0);
      expect(stdout).toHaveLength(1);
      const parsed = JSON.parse(stdout[0] ?? '') as {
        outcomes: readonly { seed: number }[];
        summary: { games: number };
      };
      expect(parsed.outcomes).toHaveLength(3);
      expect(parsed.outcomes.map((o) => o.seed)).toEqual([1, 2, 3]);
      expect(parsed.summary.games).toBe(3);
    });

    it('produces identical JSON across runs with the same flags', async () => {
      const flags = [
        'batch',
        '--player-count',
        '4',
        '--games',
        '2',
        '--seed-start',
        '7',
        '--strategy-seed',
        '11',
      ] as const;
      const first = await runCli([...flags]);
      const firstOut = stdout[0];
      stdout.length = 0;
      const second = await runCli([...flags]);
      const secondOut = stdout[0];
      expect(first).toBe(0);
      expect(second).toBe(0);
      expect(firstOut).toBe(secondOut);
    });

    it('exits with code 1 when --player-count is missing', async () => {
      const code = await runCli(['batch', '--games', '1']);
      expect(code).toBe(1);
      expect(stderr.join('\n')).toContain('player-count');
    });

    it('exits with code 1 when --games is missing', async () => {
      const code = await runCli(['batch', '--player-count', '4']);
      expect(code).toBe(1);
      expect(stderr.join('\n')).toContain('games');
    });

    it('rejects non-integer values', async () => {
      const code = await runCli([
        'batch',
        '--player-count',
        '4',
        '--games',
        'abc',
      ]);
      expect(code).toBe(1);
      expect(stderr.join('\n')).toContain('Invalid integer');
    });

    it('emits CSV with --format csv', async () => {
      const code = await runCli([
        'batch',
        '--player-count',
        '4',
        '--games',
        '2',
        '--seed-start',
        '1',
        '--format',
        'csv',
      ]);
      expect(code).toBe(0);
      const out = stdout[0] ?? '';
      expect(out.split('\n')[0]).toBe(
        'seed,winner,rounds,survivingTeams,totalDamageDealt,graveyardSize,soloTeams',
      );
      expect(out.split('\n')).toHaveLength(3);
    });

    it('emits Markdown with --format markdown', async () => {
      const code = await runCli([
        'batch',
        '--player-count',
        '4',
        '--games',
        '2',
        '--seed-start',
        '1',
        '--format',
        'markdown',
      ]);
      expect(code).toBe(0);
      const out = stdout[0] ?? '';
      expect(out).toContain('# Batch summary');
      expect(out).toContain('## Win rates by team number');
    });

    it('rejects unknown --format values', async () => {
      const code = await runCli([
        'batch',
        '--player-count',
        '4',
        '--games',
        '1',
        '--format',
        'xml',
      ]);
      expect(code).toBe(1);
      expect(stderr.join('\n')).toContain('--format');
    });

    it('writes to --output path instead of stdout', async () => {
      const dir = await mkdtemp(join(tmpdir(), 'oneiron-batch-'));
      const file = join(dir, 'report.json');
      try {
        const code = await runCli([
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
        expect(code).toBe(0);
        expect(stdout).toHaveLength(0);
        const contents = await readFile(file, 'utf8');
        const parsed = JSON.parse(contents) as { outcomes: unknown[] };
        expect(parsed.outcomes).toHaveLength(2);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    });
  });
});
