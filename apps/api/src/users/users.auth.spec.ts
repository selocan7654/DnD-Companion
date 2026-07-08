import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../app.module';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { authHeader, loginAsUser } from '../../test/auth-helper';
import { createTestUser, DEFAULT_TEST_PASSWORD } from '../../test/factories/user.factory';
import { prisma } from '../../test/setup';

describe('Users auth matrix (integration)', () => {
  let app: INestApplication;

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

  async function loginUnverifiedUser(username: string) {
    const user = await createTestUser(prisma, { username, emailVerifiedAt: null });
    const { accessToken } = await loginAsUser(app, user.email, DEFAULT_TEST_PASSWORD);
    return { user, accessToken };
  }

  describe('GET /users/me', () => {
    it('200 — authenticated user receives full profile', async () => {
      const { user, accessToken } = await loginVerifiedUser('meprofile');

      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(user.id);
      expect(res.body.data.email).toBe(user.email);
      expect(res.body.data.username).toBe(user.username);
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('200 — unverified user can read own profile', async () => {
      const { user, accessToken } = await loginUnverifiedUser('meunverified');

      const res = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(user.id);
      expect(res.body.data.email).toBe(user.email);
    });

    it('401 — guest cannot read profile', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/users/me');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /users/:id (public)', () => {
    it('200 — returns public profile fields only', async () => {
      const target = await createTestUser(prisma, { username: 'publicprofile' });

      const res = await request(app.getHttpServer()).get(`/api/v1/users/${target.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        id: target.id,
        username: target.username,
        avatarUrl: target.avatarUrl,
      });
      expect(res.body.data.email).toBeUndefined();
    });

    it('404 — deactivated user is hidden', async () => {
      const target = await createTestUser(prisma, {
        username: 'deactivatedpublic',
        isActive: false,
      });

      const res = await request(app.getHttpServer()).get(`/api/v1/users/${target.id}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /users/me', () => {
    it('200 — verified user can update username', async () => {
      const { accessToken } = await loginVerifiedUser('meupdate');

      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set(authHeader(accessToken))
        .send({ username: 'meupdate_new' });

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe('meupdate_new');
    });

    it('403 — unverified user cannot update profile', async () => {
      const { accessToken } = await loginUnverifiedUser('meupdateblocked');

      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set(authHeader(accessToken))
        .send({ username: 'blockedname' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('EMAIL_NOT_VERIFIED');
    });

    it('409 — duplicate username is rejected', async () => {
      await createTestUser(prisma, { username: 'takenname', emailVerifiedAt: new Date() });
      const { accessToken } = await loginVerifiedUser('meconflict');

      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set(authHeader(accessToken))
        .send({ username: 'takenname' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('USERNAME_ALREADY_EXISTS');
    });

    it('401 — guest cannot update profile', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .send({ username: 'guestname' });

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /users/me/password', () => {
    it('204 — correct current password updates hash and revokes refresh tokens', async () => {
      const user = await createTestUser(prisma, {
        username: 'mepassword',
        emailVerifiedAt: new Date(),
      });
      const { accessToken } = await loginAsUser(app, user.email, DEFAULT_TEST_PASSWORD);

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: 'active-refresh-hash',
          expiresAt: new Date(Date.now() + 86400000),
        },
      });

      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me/password')
        .set(authHeader(accessToken))
        .send({
          currentPassword: DEFAULT_TEST_PASSWORD,
          newPassword: 'NewPassword456',
        });

      expect(res.status).toBe(204);

      const revoked = await prisma.refreshToken.findMany({
        where: { userId: user.id, isRevoked: true },
      });
      expect(revoked.length).toBeGreaterThan(0);

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'NewPassword456' });
      expect(loginRes.status).toBe(200);
    });

    it('401 — wrong current password is rejected', async () => {
      const { accessToken } = await loginVerifiedUser('mewrongpass');

      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me/password')
        .set(authHeader(accessToken))
        .send({
          currentPassword: 'WrongPassword1',
          newPassword: 'NewPassword456',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('INVALID_CURRENT_PASSWORD');
    });

    it('401 — guest cannot change password', async () => {
      const res = await request(app.getHttpServer()).patch('/api/v1/users/me/password').send({
        currentPassword: DEFAULT_TEST_PASSWORD,
        newPassword: 'NewPassword456',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('ADMIN self profile', () => {
    it('200 — ADMIN can read and update own profile', async () => {
      const admin = await createTestUser(prisma, {
        username: 'adminself',
        role: Role.ADMIN,
        emailVerifiedAt: new Date(),
      });
      const { accessToken } = await loginAsUser(app, admin.email, DEFAULT_TEST_PASSWORD);

      const getRes = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set(authHeader(accessToken));
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.role).toBe(Role.ADMIN);

      const patchRes = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set(authHeader(accessToken))
        .send({ username: 'adminself_updated' });
      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.username).toBe('adminself_updated');
    });
  });
});
