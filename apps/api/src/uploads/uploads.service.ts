import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

import { ALLOWED_IMAGE_CONTENT_TYPES, MAX_UPLOAD_FILE_SIZE_BYTES } from '@dnd-companion/shared';

import { EnvConfig } from '../config/env.validation';
import { PresignRequestDto } from './dto/presign-request.dto';

const PRESIGN_EXPIRES_IN_SECONDS = 600;

@Injectable()
export class UploadsService {
  private readonly s3: S3Client;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    this.s3 = new S3Client({
      region: this.configService.get('S3_REGION', { infer: true }),
      endpoint: this.configService.get('S3_ENDPOINT', { infer: true }),
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESS_KEY', { infer: true }),
        secretAccessKey: this.configService.get('S3_SECRET_KEY', { infer: true }),
      },
    });
  }

  async generatePresignedUrl(dto: PresignRequestDto, userId: string) {
    this.validateUploadRequest(dto);

    const bucket = this.configService.get('S3_BUCKET', { infer: true });
    const publicBaseUrl = this.configService.get('S3_PUBLIC_URL', { infer: true });
    const key = this.buildObjectKey(dto.purpose, userId, dto.fileName);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: dto.contentType,
      ContentLength: dto.fileSize,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: PRESIGN_EXPIRES_IN_SECONDS,
    });
    const publicUrl = `${publicBaseUrl.replace(/\/$/, '')}/${key}`;

    return {
      data: {
        uploadUrl,
        publicUrl,
        expiresIn: PRESIGN_EXPIRES_IN_SECONDS,
      },
    };
  }

  private validateUploadRequest(dto: PresignRequestDto): void {
    if (!ALLOWED_IMAGE_CONTENT_TYPES.includes(dto.contentType)) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'Only PNG, JPEG, and WebP images are allowed',
      });
    }

    if (dto.fileSize > MAX_UPLOAD_FILE_SIZE_BYTES) {
      throw new BadRequestException({
        error: 'VALIDATION_ERROR',
        message: 'File size must be at most 5 MB',
      });
    }
  }

  private buildObjectKey(purpose: string, userId: string, fileName: string): string {
    const sanitizedFileName = fileName
      .replace(/\\/g, '/')
      .split('/')
      .pop()
      ?.replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 200);

    const safeName =
      sanitizedFileName && sanitizedFileName.length > 0 ? sanitizedFileName : 'upload';

    return `${purpose}/${userId}/${uuidv4()}-${safeName}`;
  }
}
