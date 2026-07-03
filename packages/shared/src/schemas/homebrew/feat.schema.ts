import { z } from 'zod';

export const featDataSchema = z.object({
  prerequisite: z.string().optional(),
  benefit: z.string().min(1),
  category: z.string().min(1),
});

export type FeatData = z.infer<typeof featDataSchema>;
