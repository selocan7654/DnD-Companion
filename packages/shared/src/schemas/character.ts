import { z } from 'zod';

import { CharacterVisibility } from '../enums';

const abilityScoreKeySchema = z.enum(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']);

export const abilityScoresSchema = z.object({
  STR: z.number().int().min(1).max(30),
  DEX: z.number().int().min(1).max(30),
  CON: z.number().int().min(1).max(30),
  INT: z.number().int().min(1).max(30),
  WIS: z.number().int().min(1).max(30),
  CHA: z.number().int().min(1).max(30),
});

export const savingThrowsSchema = z.record(abilityScoreKeySchema, z.boolean());

export const skillEntrySchema = z.object({
  proficient: z.boolean(),
  expertise: z.boolean().optional(),
});

export const skillsSchema = z.record(z.string(), skillEntrySchema);

export const featureTraitEntrySchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  source: z.string().optional(),
});

export const featuresAndTraitsSchema = z.array(featureTraitEntrySchema);

export const equipmentEntrySchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().min(1),
  equipped: z.boolean().optional(),
  notes: z.string().optional(),
});

export const equipmentSchema = z.array(equipmentEntrySchema);

export const spellSlotEntrySchema = z.object({
  max: z.number().int().min(0),
  used: z.number().int().min(0),
});

export const spellSlotsSchema = z.record(z.string(), spellSlotEntrySchema);

export const knownSpellEntrySchema = z.object({
  name: z.string().min(1),
  level: z.number().int().min(0).max(9),
  prepared: z.boolean().optional(),
});

export const knownSpellsSchema = z.array(knownSpellEntrySchema);

export const deathSavesSchema = z.object({
  successes: z.number().int().min(0).max(3),
  failures: z.number().int().min(0).max(3),
});

export const conditionsSchema = z.array(z.string().min(1));

export const characterSheetSchema = z.object({
  name: z.string().min(1).max(200),
  race: z.string().max(100).nullable().optional(),
  className: z.string().max(100).nullable().optional(),
  subclass: z.string().max(100).nullable().optional(),
  level: z.number().int().min(1).max(20).optional(),
  background: z.string().max(100).nullable().optional(),
  alignment: z.string().max(50).nullable().optional(),
  experiencePoints: z.number().int().min(0).optional(),
  abilityScores: abilityScoresSchema.optional(),
  hitPointsMax: z.number().int().min(0).nullable().optional(),
  hitPointsCurrent: z.number().int().min(0).nullable().optional(),
  temporaryHitPoints: z.number().int().min(0).optional(),
  armorClass: z.number().int().min(0).nullable().optional(),
  speed: z.number().int().min(0).nullable().optional(),
  proficiencyBonus: z.number().int().min(0).nullable().optional(),
  savingThrows: savingThrowsSchema.nullable().optional(),
  skills: skillsSchema.nullable().optional(),
  featuresAndTraits: featuresAndTraitsSchema.nullable().optional(),
  equipment: equipmentSchema.nullable().optional(),
  spellSlots: spellSlotsSchema.nullable().optional(),
  knownSpells: knownSpellsSchema.nullable().optional(),
  deathSaves: deathSavesSchema.optional(),
  conditions: conditionsSchema.optional(),
  notes: z.string().nullable().optional(),
  portraitUrl: z.string().url('Portrait URL must be a valid URL').max(500).nullable().optional(),
});

export const createCharacterSchema = z.object({
  name: z
    .string()
    .min(1, 'Character name is required')
    .max(200, 'Character name must be at most 200 characters'),
  race: z.string().max(100).optional(),
  className: z.string().max(100).optional(),
  subclass: z.string().max(100).optional(),
  level: z.number().int().min(1).max(20).optional(),
  background: z.string().max(100).optional(),
  campaignId: z.string().uuid('Campaign ID must be a valid UUID').nullable().optional(),
});

export const updateCharacterSchema = characterSheetSchema.partial();

export const assignCampaignSchema = z.object({
  campaignId: z.string().uuid('Campaign ID must be a valid UUID').nullable(),
});

export const setVisibilitySchema = z.object({
  visibility: z.nativeEnum(CharacterVisibility),
});

export type AbilityScores = z.infer<typeof abilityScoresSchema>;
export type SavingThrows = z.infer<typeof savingThrowsSchema>;
export type Skills = z.infer<typeof skillsSchema>;
export type FeaturesAndTraits = z.infer<typeof featuresAndTraitsSchema>;
export type Equipment = z.infer<typeof equipmentSchema>;
export type SpellSlots = z.infer<typeof spellSlotsSchema>;
export type KnownSpells = z.infer<typeof knownSpellsSchema>;
export type DeathSaves = z.infer<typeof deathSavesSchema>;
export type Conditions = z.infer<typeof conditionsSchema>;
export type CharacterSheet = z.infer<typeof characterSheetSchema>;
export type CreateCharacterInput = z.infer<typeof createCharacterSchema>;
export type UpdateCharacterInput = z.infer<typeof updateCharacterSchema>;
export type AssignCampaignInput = z.infer<typeof assignCampaignSchema>;
export type SetVisibilityInput = z.infer<typeof setVisibilitySchema>;
