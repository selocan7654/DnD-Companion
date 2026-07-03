import { z } from 'zod';

const spellComponentsSchema = z.object({
  V: z.boolean().optional(),
  S: z.boolean().optional(),
  M: z.union([z.string(), z.boolean()]).optional(),
});

export const spellDataSchema = z.object({
  level: z.number().int().min(0).max(9),
  school: z.string().min(1),
  casting_time: z.string().min(1),
  range: z.string().min(1),
  components: spellComponentsSchema,
  duration: z.string().min(1),
  concentration: z.boolean(),
  ritual: z.boolean(),
  classes: z.array(z.string().min(1)),
  description: z.string().min(1),
  at_higher_levels: z.string().optional(),
});

export type SpellData = z.infer<typeof spellDataSchema>;
