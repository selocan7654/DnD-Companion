import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../app.module';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { authHeader, loginAsUser } from '../../test/auth-helper';
import { createTestUser, DEFAULT_TEST_PASSWORD } from '../../test/factories/user.factory';
import { prisma } from '../../test/setup';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest
    .fn()
    .mockResolvedValue('https://storage.test.example.com/upload?signature=test'),
}));

describe('Uploads auth matrix (integration)', () => {
  let app: INestApplication;

  const validPresignPayload = {
    contentType: 'image/png',
    purpose: 'avatar',
    fileName: 'portrait.png',
    fileSize: 1024,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function loginVerifiedUser(username: string) {
    const user = await createTestUser(prisma, { username, emailVerifiedAt: new Date() });
    const { accessToken } = await loginAsUser(app, user.email, DEFAULT_TEST_PASSWORD);
    return { user, accessToken };
  }

  describe('POST /uploads/presign', () => {
    it('200 — verified user receives presigned URL for valid png', async () => {
      const { accessToken } = await loginVerifiedUser('uploaduser');

      const res = await request(app.getHttpServer())
        .post('/api/v1/uploads/presign')
        .set(authHeader(accessToken))
        .send(validPresignPayload);

      expect(res.status).toBe(200);
      expect(res.body.data.uploadUrl).toContain('https://storage.test.example.com');
      expect(res.body.data.publicUrl).toContain('https://cdn.test.example.com/avatar/');
      expect(res.body.data.expiresIn).toBe(600);
    });

    it('401 — guest cannot request presigned URL', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/uploads/presign')
        .send(validPresignPayload);

      expect(res.status).toBe(401);
    });

    it('400 — svg content type is rejected', async () => {
      const { accessToken } = await loginVerifiedUser('uploadsvg');

      const res = await request(app.getHttpServer())
        .post('/api/v1/uploads/presign')
        .set(authHeader(accessToken))
        .send({
          ...validPresignPayload,
          contentType: 'image/svg+xml',
        });

      expect(res.status).toBe(400);
    });

    it('400 — disallowed content type is rejected', async () => {
      const { accessToken } = await loginVerifiedUser('uploadgif');

      const res = await request(app.getHttpServer())
        .post('/api/v1/uploads/presign')
        .set(authHeader(accessToken))
        .send({
          ...validPresignPayload,
          contentType: 'image/gif',
        });

      expect(res.status).toBe(400);
    });

    it('400 — file size over 5 MB is rejected', async () => {
      const { accessToken } = await loginVerifiedUser('uploadbig');

      const res = await request(app.getHttpServer())
        .post('/api/v1/uploads/presign')
        .set(authHeader(accessToken))
        .send({
          ...validPresignPayload,
          fileSize: 5 * 1024 * 1024 + 1,
        });

      expect(res.status).toBe(400);
    });
  });
});
