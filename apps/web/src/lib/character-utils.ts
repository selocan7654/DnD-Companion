import type { AbilityScoreKey } from '@/types/api';

export const ABILITY_SCORE_KEYS: AbilityScoreKey[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

export function proficiencyBonusFromLevel(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
}

export function defaultAbilityScores() {
  return {
    STR: 10,
    DEX: 10,
    CON: 10,
    INT: 10,
    WIS: 10,
    CHA: 10,
  };
}
