import { describe, expect, it } from 'vitest';
import type { Card, ElementCard } from '../types/card.ts';
import type { GridCoord, TeamState } from '../types/grid.ts';
import type { LifeToken, NumberToken } from '../types/token.ts';
import { calcDamage } from './damage.ts';

function team(
  id: NumberToken,
  pos: GridCoord,
  facing: TeamState['facing'],
): TeamState {
  return {
    teamNumber: id,
    position: pos,
    facing,
    cards: [],
    players: [{ life: 4 as LifeToken }],
  };
}

const fireWater: GridCoord = { x: 'fire', y: 'water' };
const waterWater: GridCoord = { x: 'water', y: 'water' };
const fireWood: GridCoord = { x: 'fire', y: 'wood' };

const fire5: ElementCard = { kind: 'element', element: 'fire', value: 5 };
const fire1: ElementCard = { kind: 'element', element: 'fire', value: 1 };
const fire13: ElementCard = { kind: 'element', element: 'fire', value: 13 };
const wood3: ElementCard = { kind: 'element', element: 'wood', value: 3 };
const wood10: ElementCard = { kind: 'element', element: 'wood', value: 10 };
const wood11: ElementCard = { kind: 'element', element: 'wood', value: 11 };
const _water7: ElementCard = { kind: 'element', element: 'water', value: 7 };
const joker: Card = { kind: 'joker' };

const sameCellCtx = { encounterType: 'same-cell' as const };
const adjacentCtx = { encounterType: 'adjacent' as const };

describe('calcDamage — joker and absence wins', () => {
  it('joker win always returns 1', () => {
    const w = team(1 as NumberToken, fireWater, 'north');
    const l = team(2 as NumberToken, fireWater, 'south');
    expect(calcDamage(w, l, joker, fire5, sameCellCtx)).toBe(1);
  });
  it('card-absence win returns 1', () => {
    const w = team(1 as NumberToken, fireWater, 'north');
    const l = team(2 as NumberToken, fireWater, 'south');
    expect(
      calcDamage(w, l, fire5, wood3, { ...sameCellCtx, isAbsenceWin: true }),
    ).toBe(1);
  });
});

describe('calcDamage — facing bonus (same-cell)', () => {
  it('adds 1 when facing are parallel (both north/south)', () => {
    const w = team(1 as NumberToken, fireWater, 'north');
    const l = team(2 as NumberToken, fireWater, 'south');
    expect(calcDamage(w, l, fire5, wood3, sameCellCtx)).toBe(2);
  });
  it('adds 1 when facing are parallel (both east/west)', () => {
    const w = team(1 as NumberToken, fireWater, 'east');
    const l = team(2 as NumberToken, fireWater, 'west');
    expect(calcDamage(w, l, fire5, wood3, sameCellCtx)).toBe(2);
  });
  it('no bonus when perpendicular', () => {
    const w = team(1 as NumberToken, fireWater, 'north');
    const l = team(2 as NumberToken, fireWater, 'east');
    expect(calcDamage(w, l, fire5, wood3, sameCellCtx)).toBe(1);
  });
});

describe('calcDamage — facing bonus (adjacent)', () => {
  it('adds 1 when facing toward opponent and not perpendicular', () => {
    const w = team(1 as NumberToken, fireWater, 'east'); // faces east toward waterWater
    const l = team(2 as NumberToken, waterWater, 'west');
    expect(calcDamage(w, l, fire5, wood3, adjacentCtx)).toBe(2);
  });
  it('no bonus when perpendicular even if facing toward', () => {
    const w = team(1 as NumberToken, fireWater, 'east');
    const l = team(2 as NumberToken, waterWater, 'north'); // perpendicular to east
    expect(calcDamage(w, l, fire5, wood3, adjacentCtx)).toBe(1);
  });
  it('no bonus when not facing toward', () => {
    const w = team(1 as NumberToken, fireWater, 'west'); // faces away from waterWater
    const l = team(2 as NumberToken, waterWater, 'west');
    expect(calcDamage(w, l, fire5, wood3, adjacentCtx)).toBe(1);
  });
  it('adjacent y-axis: north facing gives bonus', () => {
    const w = team(1 as NumberToken, fireWater, 'north'); // water y=1 → wood y=2 is north
    const l = team(2 as NumberToken, fireWood, 'south');
    expect(calcDamage(w, l, fire5, wood3, adjacentCtx)).toBe(2);
  });
});

describe('calcDamage — value modifier', () => {
  it('bonus (+1) when winner value ≥ 2× loser', () => {
    // fire5(5) vs wood3(3): 5 < 6, but fire13(13) vs wood3(3): 13 >= 6
    const w = team(1 as NumberToken, fireWater, 'east');
    const l = team(2 as NumberToken, waterWater, 'west');
    expect(calcDamage(w, l, fire13, wood3, adjacentCtx)).toBe(3); // 1 base + 1 facing + 1 value
  });
  it('bonus (+1) when winner=13 and loser value 7–10', () => {
    const w = team(1 as NumberToken, fireWater, 'north');
    const l = team(2 as NumberToken, fireWater, 'south');
    expect(calcDamage(w, l, fire13, wood10, sameCellCtx)).toBe(3); // 1+1+1
  });
  it('bonus (+1) when winner≤2 and loser≥11', () => {
    const w = team(1 as NumberToken, fireWater, 'north');
    const l = team(2 as NumberToken, fireWater, 'south');
    expect(calcDamage(w, l, fire1, wood11, sameCellCtx)).toBe(3); // 1+1+1
  });
  it('penalty (−1) when loser value ≥ 2× winner', () => {
    // fire5(5) winner vs wood11(11) loser: 11 >= 10 → penalty
    const w = team(1 as NumberToken, fireWater, 'north');
    const l = team(2 as NumberToken, fireWater, 'south');
    expect(calcDamage(w, l, fire5, wood11, sameCellCtx)).toBe(1); // 1+1-1=1
  });
  it('penalty reduces damage toward 0', () => {
    // no facing bonus (perpendicular) + penalty = 1-1=0
    const w = team(1 as NumberToken, fireWater, 'north');
    const l = team(2 as NumberToken, fireWater, 'east'); // perpendicular → no facing bonus
    expect(calcDamage(w, l, fire5, wood11, sameCellCtx)).toBe(0); // 1+0-1=0
  });
});
