import { z } from 'zod';

const abilityScoresSchema = z.object({
  STR: z.number().int(),
  DEX: z.number().int(),
  CON: z.number().int(),
  INT: z.number().int(),
  WIS: z.number().int(),
  CHA: z.number().int(),
});

const namedDescriptionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

export const monsterDataSchema = z.object({
  size: z.string().min(1),
  creature_type: z.string().min(1),
  alignment: z.string().min(1),
  armor_class: z.number().int(),
  hit_points: z.string().min(1),
  speed: z.record(z.string(), z.string()),
  ability_scores: abilityScoresSchema,
  saving_throws: z.record(z.string(), z.number()).optional(),
  skills: z.record(z.string(), z.number()).optional(),
  damage_immunities: z.array(z.string()).optional(),
  condition_immunities: z.array(z.string()).optional(),
  senses: z.string().optional(),
  languages: z.string().optional(),
  challenge_rating: z.string().min(1),
  traits: z.array(namedDescriptionSchema).optional(),
  actions: z.array(namedDescriptionSchema).optional(),
  legendary_actions: z.array(namedDescriptionSchema).optional(),
  lair_actions: z.array(namedDescriptionSchema).optional(),
  regional_effects: z.array(namedDescriptionSchema).optional(),
});

export type MonsterData = z.infer<typeof monsterDataSchema>;
