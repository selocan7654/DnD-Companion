import { z } from 'zod';

const usernameRegex = /^[a-zA-Z0-9_-]+$/;

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(usernameRegex, 'Username may only contain letters, numbers, hyphens, and underscores')
    .optional(),
  avatarUrl: z.string().url('Invalid avatar URL').max(500).nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
