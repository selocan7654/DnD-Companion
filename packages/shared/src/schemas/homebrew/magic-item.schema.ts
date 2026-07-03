import { z } from 'zod';

export const magicItemDataSchema = z.object({
  rarity: z.string().min(1),
  type: z.string().min(1),
  attunement: z.boolean(),
  attunement_requirement: z.string().nullable().optional(),
  properties: z.string().min(1),
  charges: z.number().int().nullable().optional(),
  recharge: z.string().nullable().optional(),
});

export type MagicItemData = z.infer<typeof magicItemDataSchema>;
