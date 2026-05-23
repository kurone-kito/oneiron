import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Verifies the build is subpath-aware (see #160). We do two full
 * Vite builds — one with the default `WEB_BASE` and one with the
 * GitHub Pages subpath — and assert that the emitted asset URLs
 * differ in exactly the documented way.
 *
 * Each build takes roughly a second; running them serially in a
 * single test file keeps the suite responsive.
 */
const here = dirname(fileURLToPath(import.meta.url));
const webDir = resolve(here, '..');
const distDir = join(webDir, 'dist');
const monorepoRoot = resolve(webDir, '..', '..');

type BuildOutputs = {
  readonly indexHtml: string;
  readonly swText: string;
  readonly distFiles: readonly string[];
};

function runBuild(envBase: string | undefined): BuildOutputs {
  rmSync(distDir, { recursive: true, force: true });
  execFileSync(
    'pnpm',
    ['--filter', '@kurone-kito/oneiron-web', 'run', 'build'],
    {
      cwd: monorepoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ...(envBase === undefined ? {} : { WEB_BASE: envBase }),
      },
    },
  );
  return {
    indexHtml: readFileSync(join(distDir, 'index.html'), 'utf8'),
    swText: readFileSync(join(distDir, 'sw.js'), 'utf8'),
    distFiles: readdirSync(distDir),
  };
}

// Windows shells locate pnpm as `pnpm.cmd`, which `execFileSync`
// without a shell can't see, so this build-integration test runs
// only on POSIX. The build itself is platform-independent — the
// Linux CI jobs cover it, and local dev (macOS / Linux) catches
// regressions before they hit Windows.
const IS_WINDOWS = process.platform === 'win32';

describe.skipIf(IS_WINDOWS)('vite build base resolution', () => {
  let defaultBuild: BuildOutputs;
  let subpathBuild: BuildOutputs;

  beforeAll(() => {
    defaultBuild = runBuild(undefined);
    subpathBuild = runBuild('/oneiron/');
  }, 60_000);

  afterAll(() => {
    // Leave dist/ in the subpath shape since that's what the
    // deploy workflow expects to ship. Tests don't depend on a
    // clean-up step.
  });

  it('default build keeps asset URLs rooted at "/"', () => {
    expect(defaultBuild.indexHtml).toMatch(/src="\/assets\/[^"]+\.js"/);
    expect(defaultBuild.indexHtml).toMatch(
      /<link\s+rel="manifest"\s+href="\/manifest\.webmanifest"/,
    );
    // No subpath prefix should appear on a default build.
    expect(defaultBuild.indexHtml).not.toContain('/oneiron/');
  });

  it('subpath build prefixes every asset URL with /oneiron/', () => {
    expect(subpathBuild.indexHtml).toMatch(
      /src="\/oneiron\/assets\/[^"]+\.js"/,
    );
    expect(subpathBuild.indexHtml).toMatch(
      /<link\s+rel="manifest"\s+href="\/oneiron\/manifest\.webmanifest"/,
    );
    expect(subpathBuild.indexHtml).toMatch(
      /<link\s+rel="apple-touch-icon"\s+href="\/oneiron\/apple-touch-icon\.png"/,
    );
  });

  it('subpath build keeps the hand-written manifest with relative URLs', () => {
    // The manifest file ships unchanged from public/; relative
    // start_url/scope/icons[].src resolve against the served
    // manifest URL, which is the subpath in production.
    const manifestText = readFileSync(
      join(distDir, 'manifest.webmanifest'),
      'utf8',
    );
    const manifest = JSON.parse(manifestText) as {
      start_url: string;
      scope: string;
      icons: { src: string }[];
    };
    expect(manifest.start_url).toBe('./');
    expect(manifest.scope).toBe('./');
    for (const icon of manifest.icons) {
      expect(icon.src.startsWith('./')).toBe(true);
    }
  });

  it('subpath build registers the service worker against /oneiron/', () => {
    // Workbox precache URLs are intentionally relative — they
    // resolve against the SW's own URL at runtime — so the
    // actual subpath marker lives in `registerSW.js`, where the
    // plugin emits `navigator.serviceWorker.register(...)` with
    // the explicit scope.
    const subpathRegister = readFileSync(
      join(distDir, 'registerSW.js'),
      'utf8',
    );
    expect(subpathRegister).toMatch(
      /navigator\.serviceWorker\.register\('\/oneiron\/sw\.js'/,
    );
    expect(subpathRegister).toMatch(/scope:\s*'\/oneiron\/'/);
  });

  it('both builds emit the PWA bundle (sw.js + workbox runtime)', () => {
    expect(existsSync(join(distDir, 'sw.js'))).toBe(true);
    expect(subpathBuild.distFiles.some((f) => f.startsWith('workbox-'))).toBe(
      true,
    );
  });
});
