import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const componentsCss = readFileSync(join(here, 'components.css'), 'utf8');

/**
 * The component stylesheet is the single source of truth for the
 * touch-friendly mobile-first behaviour required by #147. These
 * tests assert structural rules that the matching components rely
 * on at runtime — they are intentionally lighter than full visual
 * regressions, since vitest + jsdom don't apply layout.
 */
describe('components.css — touch-friendly mobile rules', () => {
  describe('GameGrid', () => {
    it('uses a fixed table layout so the 3x3 fits without overflow', () => {
      expect(componentsCss).toMatch(
        /\.game-grid__table[\s\S]*?table-layout:\s*fixed/,
      );
      expect(componentsCss).toMatch(
        /\.game-grid__table[\s\S]*?max-width:\s*100%/,
      );
    });

    it('gives each cell aspect-ratio: 1 and the touch-min hit area', () => {
      expect(componentsCss).toMatch(
        /\.game-grid__cell[\s\S]*?aspect-ratio:\s*1/,
      );
      expect(componentsCss).toMatch(
        /\.game-grid__cell[\s\S]*?min-(width|height):\s*var\(--touch-min\)/,
      );
    });
  });

  describe('Hand', () => {
    it('uses horizontal scroll with snap to keep long hands bounded', () => {
      expect(componentsCss).toMatch(/\.hand__cards[\s\S]*?overflow-x:\s*auto/);
      expect(componentsCss).toMatch(
        /\.hand__cards[\s\S]*?scroll-snap-type:\s*x mandatory/,
      );
    });

    it('each card has at least the touch-min hit width', () => {
      expect(componentsCss).toMatch(
        /\.hand__card[\s\S]*?min-width:\s*var\(--touch-min\)/,
      );
    });
  });

  describe('CardFace', () => {
    it('scales via the type / spacing tokens instead of fixed pixels', () => {
      expect(componentsCss).toMatch(/\.card[\s\S]*?width:\s*clamp\(/);
      expect(componentsCss).toMatch(/\.card[\s\S]*?aspect-ratio:\s*3 \/ 4/);
    });
  });

  describe('TurnLog', () => {
    it('exposes a tap-able summary at least touch-min tall', () => {
      expect(componentsCss).toMatch(
        /\.turn-log__summary[\s\S]*?min-height:\s*var\(--touch-min\)/,
      );
    });

    it('caps body height so the log can scroll independently', () => {
      expect(componentsCss).toMatch(
        /\.turn-log__list[\s\S]*?max-height:\s*\d+vh/,
      );
      expect(componentsCss).toMatch(
        /\.turn-log__list[\s\S]*?overflow-y:\s*auto/,
      );
    });
  });
});
