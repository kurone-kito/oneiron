import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const tokensPath = join(here, 'tokens.css');
const indexHtmlPath = resolve(here, '..', '..', 'index.html');
const tokensCss = readFileSync(tokensPath, 'utf8');
const indexHtml = readFileSync(indexHtmlPath, 'utf8');

describe('mobile-first design tokens', () => {
  it.each([
    ['--space-1', '--space-7'],
    ['--color-bg', '--color-fg'],
    ['--color-fire', '--color-water', '--color-wood'],
    ['--type-body', '--type-heading-1'],
    ['--radius-1', '--radius-3'],
    ['--bp-tablet'],
    ['--touch-min'],
  ] satisfies readonly (readonly string[])[])('exposes the expected tokens (%s)', (...tokens) => {
    for (const token of tokens) {
      expect(tokensCss).toContain(`${token}:`);
    }
  });

  it('applies a global box-sizing reset', () => {
    expect(tokensCss).toMatch(
      /\*[\s,*:before:after\n]*\{[^}]*box-sizing:\s*border-box/m,
    );
  });

  it('declares color-scheme so OS dark mode is respected', () => {
    expect(tokensCss).toMatch(/color-scheme:\s*light dark/);
  });

  it('defines a dark-mode override', () => {
    expect(tokensCss).toMatch(/@media\s*\(prefers-color-scheme:\s*dark\)/);
  });
});

describe('index.html viewport baseline', () => {
  it('declares width=device-width and viewport-fit=cover', () => {
    expect(indexHtml).toMatch(/name="viewport"/);
    expect(indexHtml).toMatch(/width=device-width/);
    expect(indexHtml).toMatch(/initial-scale=1/);
    expect(indexHtml).toMatch(/viewport-fit=cover/);
  });

  it('declares theme-color for both light and dark schemes', () => {
    expect(indexHtml).toMatch(
      /name="theme-color"\s+content="[^"]+"\s+media="\(prefers-color-scheme: light\)"/,
    );
    expect(indexHtml).toMatch(
      /name="theme-color"\s+content="[^"]+"\s+media="\(prefers-color-scheme: dark\)"/,
    );
  });
});
