import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../app.module';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { EmailService } from '../email/email.service';
import { authHeader, extractRefreshToken, loginAsUser } from '../../test/auth-helper';
import { createTestUser, DEFAULT_TEST_PASSWORD } from '../../test/factories/user.factory';
import { prisma } from '../../test/setup';

describe('AuthController (integration)', () => {
  let app: INestApplication;
  let emailService: EmailService;

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

    emailService = moduleFixture.get(EmailService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    emailService.clearTokens();
  });

  describe('POST /auth/verify-email', () => {
    it('400 — invalid verification token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token: 'invalid-token-value' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_VERIFICATION_TOKEN');
    });
  });

  describe('POST /auth/refresh', () => {
    it('401 — missing refresh cookie', async () => {
      const res = await request(app.getHttpServer()).post('/api/v1/auth/refresh');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/register', () => {
    it('201 — creates user without password_hash in response', async () => {
      const res = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email: 'newplayer@test.local',
        username: 'newplayer',
        password: 'SecurePass123',
      });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        email: 'newplayer@test.local',
        username: 'newplayer',
        role: 'USER',
        emailVerifiedAt: null,
      });
      expect(res.body.data.passwordHash).toBeUndefined();
      expect(res.body.data.password_hash).toBeUndefined();
      expect(emailService.getVerificationTokenForEmail('newplayer@test.local')).toBeDefined();
    });

    it('409 — duplicate email', async () => {
      await createTestUser(prisma, { email: 'dup@test.local', username: 'dupuser1' });

      const res = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email: 'dup@test.local',
        username: 'dupuser2',
        password: 'SecurePass123',
      });

      expect(res.status).toBe(409);
    });

    it('409 — duplicate username', async () => {
      await createTestUser(prisma, { email: 'user1@test.local', username: 'takenname' });

      const res = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email: 'user2@test.local',
        username: 'takenname',
        password: 'SecurePass123',
      });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    it('401 — unknown email returns generic message', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@test.local', password: 'WrongPassword1' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('401 — wrong password returns generic message', async () => {
      const user = await createTestUser(prisma, {
        email: 'login@test.local',
        username: 'loginuser',
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'WrongPassword1' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('403 — deactivated user cannot login', async () => {
      const user = await createTestUser(prisma, {
        email: 'inactive@test.local',
        username: 'inactiveuser',
        isActive: false,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: DEFAULT_TEST_PASSWORD });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('ACCOUNT_DEACTIVATED');
    });
  });

  describe('auth flow: register → verify → login → refresh → logout', () => {
    it('completes full session lifecycle', async () => {
      const registerRes = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email: 'flow@test.local',
        username: 'flowuser',
        password: 'FlowPass1234',
      });

      expect(registerRes.status).toBe(201);

      const verifyToken = emailService.getVerificationTokenForEmail('flow@test.local');
      expect(verifyToken).toBeDefined();

      const verifyRes = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token: verifyToken });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.message).toBe('Email verified successfully');

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'flow@test.local', password: 'FlowPass1234' });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.accessToken).toBeDefined();
      expect(loginRes.body.data.user.passwordHash).toBeUndefined();

      const refreshCookie = loginRes.headers['set-cookie']?.[0] as string;
      expect(refreshCookie).toContain('refreshToken=');
      expect(refreshCookie).toContain('HttpOnly');
      expect(refreshCookie).toContain('SameSite=Strict');

      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', refreshCookie);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.accessToken).toBeDefined();

      const newRefreshCookie = refreshRes.headers['set-cookie']?.[0] as string;
      const accessToken = refreshRes.body.data.accessToken as string;

      const logoutRes = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', newRefreshCookie)
        .set(authHeader(accessToken));

      expect(logoutRes.status).toBe(204);
    });
  });

  describe('POST /auth/refresh — reuse detection', () => {
    it('401 — reusing revoked refresh token revokes all user tokens', async () => {
      const user = await createTestUser(prisma, {
        email: 'reuse@test.local',
        username: 'reuseuser',
      });

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: DEFAULT_TEST_PASSWORD });

      const oldCookie = loginRes.headers['set-cookie']?.[0] as string;
      const oldToken = extractRefreshToken(oldCookie);

      const firstRefresh = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', oldCookie);

      expect(firstRefresh.status).toBe(200);

      const reuseRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${oldToken}`);

      expect(reuseRes.status).toBe(401);

      const refreshWithRotatedCookie = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', firstRefresh.headers['set-cookie']?.[0] as string);

      expect(refreshWithRotatedCookie.status).toBe(401);

      const newLogin = await loginAsUser(app, user.email, DEFAULT_TEST_PASSWORD);
      const freshRefresh = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Cookie', newLogin.refreshCookie);

      expect(freshRefresh.status).toBe(200);
    });
  });

  describe('POST /auth/password-reset', () => {
    it('request always returns 200; confirm resets password', async () => {
      const user = await createTestUser(prisma, {
        email: 'reset@test.local',
        username: 'resetuser',
      });

      const requestRes = await request(app.getHttpServer())
        .post('/api/v1/auth/password-reset/request')
        .send({ email: user.email });

      expect(requestRes.status).toBe(200);
      expect(requestRes.body.data.message).toContain('If an account with this email exists');

      const unknownRes = await request(app.getHttpServer())
        .post('/api/v1/auth/password-reset/request')
        .send({ email: 'unknown@test.local' });

      expect(unknownRes.status).toBe(200);

      const resetToken = emailService.getPasswordResetTokenForEmail(user.email);
      expect(resetToken).toBeDefined();

      const confirmRes = await request(app.getHttpServer())
        .post('/api/v1/auth/password-reset/confirm')
        .send({ token: resetToken, newPassword: 'NewSecurePass1' });

      expect(confirmRes.status).toBe(200);

      const oldLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: DEFAULT_TEST_PASSWORD });

      expect(oldLogin.status).toBe(401);

      const newLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'NewSecurePass1' });

      expect(newLogin.status).toBe(200);
    });

    it('400 — invalid reset token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/password-reset/confirm')
        .send({ token: 'bad-token', newPassword: 'NewSecurePass1' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_RESET_TOKEN');
    });
  });

  describe('auth rate limiting', () => {
    it('429 — sixth login attempt within window', async () => {
      const user = await createTestUser(prisma, {
        email: 'ratelimit-login@test.local',
        username: 'ratelimitlogin',
      });

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const res = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: user.email, password: 'WrongPassword1' });

        expect(res.status).toBe(401);
      }

      const limited = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'WrongPassword1' });

      expect(limited.status).toBe(429);
      expect(limited.body.error).toBe('TOO_MANY_REQUESTS');
      expect(limited.body.message).toBe('Too many requests. Please try again later.');
      expect(limited.headers['retry-after']).toBe('900');
    });

    it('429 — sixth register attempt within window', async () => {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const res = await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({
            email: `ratelimit-reg-${attempt}@test.local`,
            username: `ratelimit${attempt}`,
            password: 'SecurePass123',
          });

        expect(res.status).toBe(201);
      }

      const limited = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email: 'ratelimit-reg-5@test.local',
        username: 'ratelimit5',
        password: 'SecurePass123',
      });

      expect(limited.status).toBe(429);
      expect(limited.body.message).toBe('Too many requests. Please try again later.');
    });

    it('429 — sixth password-reset request within window', async () => {
      const user = await createTestUser(prisma, {
        email: 'ratelimit-reset@test.local',
        username: 'ratelimitreset',
      });

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const res = await request(app.getHttpServer())
          .post('/api/v1/auth/password-reset/request')
          .send({ email: user.email });

        expect(res.status).toBe(200);
      }

      const limited = await request(app.getHttpServer())
        .post('/api/v1/auth/password-reset/request')
        .send({ email: user.email });

      expect(limited.status).toBe(429);
      expect(limited.body.message).toBe('Too many requests. Please try again later.');
    });
  });

  describe('POST /auth/verify-email — single use', () => {
    it('400 — verification token cannot be reused', async () => {
      const registerRes = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email: 'singleuse@test.local',
        username: 'singleuseuser',
        password: 'SingleUsePass1',
      });

      expect(registerRes.status).toBe(201);

      const verifyToken = emailService.getVerificationTokenForEmail('singleuse@test.local');
      expect(verifyToken).toBeDefined();

      const firstVerify = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token: verifyToken });

      expect(firstVerify.status).toBe(200);

      const secondVerify = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token: verifyToken });

      expect(secondVerify.status).toBe(400);
      expect(secondVerify.body.error).toBe('INVALID_VERIFICATION_TOKEN');
    });
  });

  describe('POST /auth/resend-verification', () => {
    it('200 — sends new verification email for unverified user', async () => {
      const registerRes = await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        email: 'resend@test.local',
        username: 'resenduser',
        password: 'ResendPass123',
      });

      expect(registerRes.status).toBe(201);
      emailService.clearTokens();

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'resend@test.local', password: 'ResendPass123' });

      const accessToken = loginRes.body.data.accessToken as string;

      const resendRes = await request(app.getHttpServer())
        .post('/api/v1/auth/resend-verification')
        .set(authHeader(accessToken));

      expect(resendRes.status).toBe(200);
      expect(emailService.getVerificationTokenForEmail('resend@test.local')).toBeDefined();
    });

    it('200 — already verified user gets informational message', async () => {
      const user = await createTestUser(prisma, {
        email: 'verified@test.local',
        username: 'verifieduser',
      });

      const { accessToken } = await loginAsUser(app, user.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/resend-verification')
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Email is already verified');
    });

    it('401 — unauthenticated request rejected', async () => {
      const res = await request(app.getHttpServer()).post('/api/v1/auth/resend-verification');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/dev/verification-token', () => {
    it('404 — unavailable outside development', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/v1/auth/dev/verification-token?email=newplayer@test.local',
      );

      expect(res.status).toBe(404);
    });
  });
});
