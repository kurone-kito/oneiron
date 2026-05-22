import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, '..', 'public');
const manifestPath = join(publicDir, 'manifest.webmanifest');
const indexHtmlPath = resolve(here, '..', 'index.html');

type WebmanifestIcon = {
  readonly src: string;
  readonly sizes: string;
  readonly type: string;
  readonly purpose?: string;
};

type Webmanifest = {
  readonly name?: string;
  readonly short_name?: string;
  readonly description?: string;
  readonly start_url?: string;
  readonly scope?: string;
  readonly display?: string;
  readonly orientation?: string;
  readonly background_color?: string;
  readonly theme_color?: string;
  readonly icons?: readonly WebmanifestIcon[];
};

const manifestText = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(manifestText) as Webmanifest;
const indexHtml = readFileSync(indexHtmlPath, 'utf8');

describe('PWA manifest', () => {
  it('declares the required identity fields', () => {
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
  });

  it('declares theme + background colors', () => {
    expect(manifest.background_color).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    expect(manifest.theme_color).toMatch(/^#[0-9a-fA-F]{3,8}$/);
  });

  it('declares 192 and 512 icons plus a maskable variant', () => {
    const icons = manifest.icons ?? [];
    const sizes = icons.map((icon) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    const maskable = icons.find((icon) => icon.purpose === 'maskable');
    expect(maskable).toBeDefined();
    expect(maskable?.sizes).toBe('512x512');
  });

  it('ships every referenced icon file under public/', () => {
    const icons = manifest.icons ?? [];
    for (const icon of icons) {
      // src is rooted at /, mapped to public/<filename>.
      const localPath = join(publicDir, icon.src.replace(/^\//, ''));
      expect(existsSync(localPath)).toBe(true);
      expect(statSync(localPath).size).toBeGreaterThan(0);
    }
    // apple-touch-icon is not in the manifest but is required by iOS.
    expect(existsSync(join(publicDir, 'apple-touch-icon.png'))).toBe(true);
  });
});

describe('index.html PWA wiring', () => {
  it('links the manifest', () => {
    expect(indexHtml).toMatch(
      /<link\s+rel="manifest"\s+href="\/manifest\.webmanifest"\s*\/?>/,
    );
  });

  it('links the apple-touch-icon', () => {
    expect(indexHtml).toMatch(
      /<link\s+rel="apple-touch-icon"\s+href="\/apple-touch-icon\.png"\s*\/?>/,
    );
  });
});
