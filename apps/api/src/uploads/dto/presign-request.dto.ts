import { IsEnum, IsIn, IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  MAX_UPLOAD_FILE_SIZE_BYTES,
  UploadPurpose,
} from '@dnd-companion/shared';

export class PresignRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsIn([...ALLOWED_IMAGE_CONTENT_TYPES], {
    message: 'Only PNG, JPEG, and WebP images are allowed',
  })
  contentType!: (typeof ALLOWED_IMAGE_CONTENT_TYPES)[number];

  @IsEnum(UploadPurpose, {
    message: 'Invalid upload purpose',
  })
  purpose!: UploadPurpose;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_UPLOAD_FILE_SIZE_BYTES)
  fileSize!: number;
}
