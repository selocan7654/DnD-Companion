import { z } from 'zod';

import { UploadPurpose } from '../enums';

export const ALLOWED_IMAGE_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export const MAX_UPLOAD_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const presignRequestSchema = z.object({
  contentType: z.enum(ALLOWED_IMAGE_CONTENT_TYPES, {
    errorMap: () => ({ message: 'Only PNG, JPEG, and WebP images are allowed' }),
  }),
  purpose: z.nativeEnum(UploadPurpose, {
    required_error: 'Upload purpose is required',
  }),
  fileName: z
    .string()
    .min(1, 'File name is required')
    .max(255, 'File name must be at most 255 characters'),
  fileSize: z
    .number()
    .int('File size must be an integer')
    .positive('File size must be greater than zero')
    .max(MAX_UPLOAD_FILE_SIZE_BYTES, 'File size must be at most 5 MB'),
});

export const presignResponseSchema = z.object({
  uploadUrl: z.string().url(),
  publicUrl: z.string().url(),
  expiresIn: z.number().int().positive(),
});

export type PresignRequestInput = z.infer<typeof presignRequestSchema>;
export type PresignResponse = z.infer<typeof presignResponseSchema>;
