import { z } from 'zod';
import { updateProfileSchema } from '@dnd-companion/shared';

export const profileFormSchema = updateProfileSchema.extend({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username may only contain letters, numbers, hyphens, and underscores',
    ),
});

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ProfileFormInput = z.infer<typeof profileFormSchema>;
export type ChangePasswordFormInput = z.infer<typeof changePasswordFormSchema>;
