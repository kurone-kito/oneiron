import { describe, expect, it } from 'vitest';
import type { ElementCard, JokerCard } from '../types/card.ts';
import { resolveCards } from './resolve.ts';

const fire5: ElementCard = { kind: 'element', element: 'fire', value: 5 };
const fire9: ElementCard = { kind: 'element', element: 'fire', value: 9 };
const water3: ElementCard = { kind: 'element', element: 'water', value: 3 };
const water7: ElementCard = { kind: 'element', element: 'water', value: 7 };
const wood1: ElementCard = { kind: 'element', element: 'wood', value: 1 };
const wood12: ElementCard = { kind: 'element', element: 'wood', value: 12 };
const joker: JokerCard = { kind: 'joker' };

describe('resolveCards — joker rules', () => {
  it('joker vs joker is a draw', () => {
    expect(resolveCards(joker, joker)).toBe('draw');
  });
  it('joker beats fire', () => {
    expect(resolveCards(joker, fire5)).toBe('a');
    expect(resolveCards(fire5, joker)).toBe('b');
  });
  it('joker beats water', () => {
    expect(resolveCards(joker, water3)).toBe('a');
    expect(resolveCards(water3, joker)).toBe('b');
  });
  it('joker beats wood', () => {
    expect(resolveCards(joker, wood1)).toBe('a');
    expect(resolveCards(wood1, joker)).toBe('b');
  });
});

describe('resolveCards — element matchups', () => {
  it('fire beats wood', () => {
    expect(resolveCards(fire5, wood1)).toBe('a');
    expect(resolveCards(wood12, fire9)).toBe('b');
  });
  it('wood beats water', () => {
    expect(resolveCards(wood1, water3)).toBe('a');
    expect(resolveCards(water7, wood12)).toBe('b');
  });
  it('water beats fire', () => {
    expect(resolveCards(water3, fire5)).toBe('a');
    expect(resolveCards(fire9, water7)).toBe('b');
  });
});

describe('resolveCards — draws', () => {
  it('same element is a draw regardless of value', () => {
    expect(resolveCards(fire5, fire9)).toBe('draw');
    expect(resolveCards(water3, water7)).toBe('draw');
    expect(resolveCards(wood1, wood12)).toBe('draw');
  });
});
