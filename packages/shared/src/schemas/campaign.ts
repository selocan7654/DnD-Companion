import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z
    .string()
    .min(1, 'Campaign name is required')
    .max(200, 'Campaign name must be at most 200 characters'),
  description: z.string().max(10000, 'Description must be at most 10000 characters').optional(),
  setting: z.string().max(200, 'Setting must be at most 200 characters').optional(),
});

export const updateCampaignSchema = z.object({
  name: z
    .string()
    .min(1, 'Campaign name is required')
    .max(200, 'Campaign name must be at most 200 characters')
    .optional(),
  description: z
    .string()
    .max(10000, 'Description must be at most 10000 characters')
    .nullable()
    .optional(),
  bannerUrl: z
    .string()
    .url('Banner URL must be a valid URL')
    .max(500, 'Banner URL must be at most 500 characters')
    .nullable()
    .optional(),
  setting: z.string().max(200, 'Setting must be at most 200 characters').nullable().optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
