import { z } from 'zod';

const suggestedCharacteristicsSchema = z.object({
  personality_traits: z.array(z.string()).optional(),
  ideals: z.array(z.string()).optional(),
  bonds: z.array(z.string()).optional(),
  flaws: z.array(z.string()).optional(),
});

export const backgroundDataSchema = z.object({
  skill_proficiencies: z.array(z.string().min(1)),
  tool_proficiencies: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  equipment: z.string().optional(),
  feature_name: z.string().min(1),
  feature_description: z.string().min(1),
  suggested_characteristics: suggestedCharacteristicsSchema.optional(),
});

export type BackgroundData = z.infer<typeof backgroundDataSchema>;
