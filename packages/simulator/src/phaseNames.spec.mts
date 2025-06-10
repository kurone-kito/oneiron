import { describe, expect, it } from 'vitest';
import { getPhaseName } from './phaseNames.mjs';
import type { Phase } from './types.mjs';

const cases: [Phase, string][] = [
  ['setup', 'セットアップ'],
  ['round0-prep', '事前準備'],
  ['round0-descent', '降下'],
  ['battle', 'バトル'],
  ['forbidden', '禁止エリア'],
  ['movement', '移動'],
  ['revival', '復活'],
  ['finished', '終了'],
];

describe('getPhaseName', () => {
  for (const [id, name] of cases) {
    it(`${id} -> ${name}`, () => {
      expect(getPhaseName(id)).toBe(name);
    });
  }
});
