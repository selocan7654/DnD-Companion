import { z } from 'zod';
import { registerSchema } from '@dnd-companion/shared';

export const registerFormSchema = registerSchema
  .extend({
    passwordConfirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  });

export const passwordResetConfirmFormSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormInput = z.infer<typeof registerFormSchema>;
export type PasswordResetConfirmFormInput = z.infer<typeof passwordResetConfirmFormSchema>;
