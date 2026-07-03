import { describe, expect, it } from 'vitest';

import { abilityModifier, formatModifier, proficiencyBonusFromLevel } from '@/lib/character-utils';

describe('abilityModifier', () => {
  it('calculates modifier as Math.floor((score - 10) / 2)', () => {
    expect(abilityModifier(10)).toBe(0);
    expect(abilityModifier(11)).toBe(0);
    expect(abilityModifier(12)).toBe(1);
    expect(abilityModifier(14)).toBe(2);
    expect(abilityModifier(8)).toBe(-1);
    expect(abilityModifier(20)).toBe(5);
  });
});

describe('formatModifier', () => {
  it('prefixes positive modifiers with +', () => {
    expect(formatModifier(2)).toBe('+2');
    expect(formatModifier(0)).toBe('+0');
    expect(formatModifier(-1)).toBe('-1');
  });
});

describe('proficiencyBonusFromLevel', () => {
  it('returns level-based proficiency bonus', () => {
    expect(proficiencyBonusFromLevel(1)).toBe(2);
    expect(proficiencyBonusFromLevel(5)).toBe(3);
    expect(proficiencyBonusFromLevel(20)).toBe(6);
  });
});
