import { describe, expect, it } from 'vitest';
import { getAttributeEmoji, getDirectionEmoji } from './emoji.mjs';

describe('emoji helpers', () => {
  it('returns attribute emoji', () => {
    expect(getAttributeEmoji('fire')).toBe('🔥');
    expect(getAttributeEmoji('water')).toBe('💧');
    expect(getAttributeEmoji('wood')).toBe('🌳');
  });

  it('returns direction emoji', () => {
    expect(getDirectionEmoji('north')).toBe('↑');
    expect(getDirectionEmoji('south')).toBe('↓');
    expect(getDirectionEmoji('east')).toBe('→');
    expect(getDirectionEmoji('west')).toBe('←');
  });
});
