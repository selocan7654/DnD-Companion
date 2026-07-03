import { z } from 'zod';

import { HomebrewType } from '../enums';
import { getHomebrewDataSchema } from './homebrew';

export const homebrewFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(200, 'Name must be at most 200 characters'),
    type: z.nativeEnum(HomebrewType, { required_error: 'Type is required' }),
    description: z.string().max(5000).optional(),
    data: z.record(z.unknown()),
  })
  .superRefine((values, ctx) => {
    const dataSchema = getHomebrewDataSchema(values.type);
    const result = dataSchema.safeParse(values.data);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['data', ...issue.path.map(String)],
          message: issue.message,
        });
      }
    }
  });

export type HomebrewFormValues = z.infer<typeof homebrewFormSchema>;

export type CreateHomebrewInput = {
  name: string;
  type: HomebrewType;
  description?: string;
  imageUrl?: string | null;
  data: Record<string, unknown>;
};

export type UpdateHomebrewInput = {
  name?: string;
  description?: string;
  imageUrl?: string | null;
  data?: Record<string, unknown>;
};
