import type { UpdateCharacterInput } from '@dnd-companion/shared';

import { defaultAbilityScores } from '@/lib/character-utils';
import type { AbilityScores, Character, EquipmentEntry, KnownSpellEntry } from '@/types/api';

export interface CharacterBuilderFormValues {
  name: string;
  race: string;
  className: string;
  subclass: string;
  level: number;
  background: string;
  alignment: string;
  notes: string;
  abilityScores: AbilityScores;
  armorClass: number | '';
  speed: number | '';
  equipment: EquipmentEntry[];
  knownSpells: KnownSpellEntry[];
  hitPointsMax: number | '';
  hitPointsCurrent: number | '';
  temporaryHitPoints: number | '';
  proficiencyBonus: number | '';
}

export function getDefaultBuilderValues(): CharacterBuilderFormValues {
  return {
    name: '',
    race: '',
    className: '',
    subclass: '',
    level: 1,
    background: '',
    alignment: '',
    notes: '',
    abilityScores: defaultAbilityScores(),
    armorClass: '',
    speed: '',
    equipment: [],
    knownSpells: [],
    hitPointsMax: '',
    hitPointsCurrent: '',
    temporaryHitPoints: '',
    proficiencyBonus: '',
  };
}

export function mapCharacterToForm(character: Character): CharacterBuilderFormValues {
  return {
    name: character.name,
    race: character.race ?? '',
    className: character.className ?? '',
    subclass: character.subclass ?? '',
    level: character.level,
    background: character.background ?? '',
    alignment: character.alignment ?? '',
    notes: character.notes ?? '',
    abilityScores: character.abilityScores ?? defaultAbilityScores(),
    armorClass: character.armorClass ?? '',
    speed: character.speed ?? '',
    equipment: character.equipment ?? [],
    knownSpells: character.knownSpells ?? [],
    hitPointsMax: character.hitPointsMax ?? '',
    hitPointsCurrent: character.hitPointsCurrent ?? '',
    temporaryHitPoints: character.temporaryHitPoints ?? '',
    proficiencyBonus: character.proficiencyBonus ?? '',
  };
}

function emptyToNull(value: string): string | null {
  return value.trim() === '' ? null : value.trim();
}

function numberOrNull(value: number | ''): number | null | undefined {
  if (value === '') return null;
  return value;
}

export function buildPatchBody(values: CharacterBuilderFormValues): UpdateCharacterInput {
  const body: UpdateCharacterInput = {
    name: values.name.trim(),
    race: emptyToNull(values.race),
    className: emptyToNull(values.className),
    subclass: emptyToNull(values.subclass),
    level: values.level,
    background: emptyToNull(values.background),
    alignment: emptyToNull(values.alignment),
    notes: emptyToNull(values.notes),
    abilityScores: values.abilityScores,
    armorClass: numberOrNull(values.armorClass),
    speed: numberOrNull(values.speed),
    equipment: values.equipment.filter((item) => item.name.trim() !== ''),
    knownSpells: values.knownSpells.filter((spell) => spell.name.trim() !== ''),
    hitPointsMax: numberOrNull(values.hitPointsMax),
    hitPointsCurrent: numberOrNull(values.hitPointsCurrent),
    temporaryHitPoints: values.temporaryHitPoints === '' ? undefined : values.temporaryHitPoints,
    proficiencyBonus: numberOrNull(values.proficiencyBonus),
  };

  return body;
}
