import { z } from 'zod';

const subclassFeatureSchema = z.object({
  level: z.number().int().min(1).max(20),
  name: z.string().min(1),
  description: z.string().min(1),
});

export const subclassDataSchema = z.object({
  parent_class: z.string().min(1),
  flavor_text: z.string().optional(),
  features: z.array(subclassFeatureSchema).min(1),
});

export type SubclassData = z.infer<typeof subclassDataSchema>;
