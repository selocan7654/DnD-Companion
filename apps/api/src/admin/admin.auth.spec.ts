import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditAction, Role } from '@prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../app.module';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { authHeader, loginAsUser } from '../../test/auth-helper';
import { addCampaignMember, createTestCampaign } from '../../test/factories/campaign.factory';
import { createTestUser, DEFAULT_TEST_PASSWORD } from '../../test/factories/user.factory';
import { prisma } from '../../test/setup';

describe('Admin auth matrix (integration)', () => {
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

  async function loginAdmin(username = 'matrixadmin') {
    const admin = await createTestUser(prisma, {
      username,
      role: Role.ADMIN,
      emailVerifiedAt: new Date(),
    });
    const { accessToken } = await loginAsUser(app, admin.email, DEFAULT_TEST_PASSWORD);
    return { admin, accessToken };
  }

  async function loginVerifiedUser(username: string) {
    const user = await createTestUser(prisma, { username, emailVerifiedAt: new Date() });
    const { accessToken } = await loginAsUser(app, user.email, DEFAULT_TEST_PASSWORD);
    return { user, accessToken };
  }

  describe('USER denied on /admin/*', () => {
    it('403 — USER cannot GET /admin/users', async () => {
      const { accessToken } = await loginVerifiedUser('adminuserlist');
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set(authHeader(accessToken));

      expect(res.status).toBe(403);
    });

    it('403 — USER cannot PATCH /admin/users/:id/role', async () => {
      const { user, accessToken } = await loginVerifiedUser('adminuserrole');
      const target = await createTestUser(prisma, { username: 'roletarget' });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${target.id}/role`)
        .set(authHeader(accessToken))
        .send({ role: Role.ADMIN });

      expect(res.status).toBe(403);
      expect(user.role).toBe(Role.USER);
    });

    it('403 — USER cannot POST /admin/users/:id/deactivate', async () => {
      const { accessToken } = await loginVerifiedUser('adminuserdeact');
      const target = await createTestUser(prisma, { username: 'deacttarget' });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/users/${target.id}/deactivate`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(403);
    });

    it('403 — USER cannot POST /admin/users/:id/reactivate', async () => {
      const { accessToken } = await loginVerifiedUser('adminuserreact');
      const target = await createTestUser(prisma, {
        username: 'reacttarget',
        isActive: false,
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/users/${target.id}/reactivate`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(403);
    });

    it('403 — USER cannot GET /admin/campaigns', async () => {
      const { accessToken } = await loginVerifiedUser('adminusercamp');
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/campaigns')
        .set(authHeader(accessToken));

      expect(res.status).toBe(403);
    });

    it('403 — USER cannot GET /admin/characters', async () => {
      const { accessToken } = await loginVerifiedUser('adminuserchar');
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/characters')
        .set(authHeader(accessToken));

      expect(res.status).toBe(403);
    });

    it('403 — USER cannot GET /admin/homebrew', async () => {
      const { accessToken } = await loginVerifiedUser('adminuserhb');
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/homebrew')
        .set(authHeader(accessToken));

      expect(res.status).toBe(403);
    });
  });

  describe('guest denied on /admin/*', () => {
    it('401 — guest cannot GET /admin/users', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/admin/users');
      expect(res.status).toBe(401);
    });

    it('401 — guest cannot PATCH /admin/users/:id/role', async () => {
      const target = await createTestUser(prisma, { username: 'guestroletarget' });
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${target.id}/role`)
        .send({ role: Role.ADMIN });

      expect(res.status).toBe(401);
    });

    it('401 — guest cannot POST /admin/users/:id/deactivate', async () => {
      const target = await createTestUser(prisma, { username: 'guestdeacttarget' });
      const res = await request(app.getHttpServer()).post(
        `/api/v1/admin/users/${target.id}/deactivate`,
      );

      expect(res.status).toBe(401);
    });

    it('401 — guest cannot POST /admin/users/:id/reactivate', async () => {
      const target = await createTestUser(prisma, {
        username: 'guestreacttarget',
        isActive: false,
      });
      const res = await request(app.getHttpServer()).post(
        `/api/v1/admin/users/${target.id}/reactivate`,
      );

      expect(res.status).toBe(401);
    });

    it('401 — guest cannot GET /admin/campaigns', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/admin/campaigns');
      expect(res.status).toBe(401);
    });
  });

  describe('ADMIN role change + audit', () => {
    it('200 — ADMIN changes role and inserts ROLE_CHANGED audit', async () => {
      const { admin, accessToken } = await loginAdmin('roledmaudit');
      // Keep a second admin so demotion of a freshly promoted user is still allowed later.
      await createTestUser(prisma, {
        username: 'secondadminrole',
        role: Role.ADMIN,
        emailVerifiedAt: new Date(),
      });
      const target = await createTestUser(prisma, { username: 'promoteme' });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${target.id}/role`)
        .set(authHeader(accessToken))
        .send({ role: Role.ADMIN });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe(Role.ADMIN);

      const audit = await prisma.auditLog.findFirst({
        where: {
          actorId: admin.id,
          targetId: target.id,
          action: AuditAction.ROLE_CHANGED,
        },
      });
      expect(audit).not.toBeNull();
      expect(audit?.metadata).toMatchObject({
        oldRole: Role.USER,
        newRole: Role.ADMIN,
      });
    });
  });

  describe('ADMIN deactivate + audit', () => {
    it('200 — ADMIN deactivates user, inserts USER_DEACTIVATED audit, login fails', async () => {
      const { admin, accessToken } = await loginAdmin('deactaudit');
      const target = await createTestUser(prisma, { username: 'soonoff' });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/users/${target.id}/deactivate`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);

      const audit = await prisma.auditLog.findFirst({
        where: {
          actorId: admin.id,
          targetId: target.id,
          action: AuditAction.USER_DEACTIVATED,
        },
      });
      expect(audit).not.toBeNull();
      expect(audit?.metadata).toMatchObject({
        targetEmail: target.email,
        targetUsername: target.username,
      });

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: target.email, password: DEFAULT_TEST_PASSWORD });

      expect([401, 403]).toContain(loginRes.status);
    });
  });

  describe('LAST_ADMIN', () => {
    it('422 — demoting the sole active admin returns LAST_ADMIN', async () => {
      const { admin, accessToken } = await loginAdmin('soleadmin');

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${admin.id}/role`)
        .set(authHeader(accessToken))
        .send({ role: Role.USER });

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('LAST_ADMIN');
    });

    it('422 — deactivating the sole active admin returns LAST_ADMIN', async () => {
      const { admin, accessToken } = await loginAdmin('soleadmindeact');

      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/users/${admin.id}/deactivate`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('LAST_ADMIN');
    });
  });

  describe('deactivated owner content hiding', () => {
    it('404 — campaign member cannot GET campaign when owner is deactivated', async () => {
      const owner = await createTestUser(prisma, { username: 'deadowner' });
      const member = await createTestUser(prisma, { username: 'livemember' });
      const campaign = await createTestCampaign(prisma, owner.id);
      await addCampaignMember(prisma, campaign.id, member.id);

      await prisma.user.update({ where: { id: owner.id }, data: { isActive: false } });

      const { accessToken } = await loginAsUser(app, member.email, DEFAULT_TEST_PASSWORD);
      const res = await request(app.getHttpServer())
        .get(`/api/v1/campaigns/${campaign.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(404);
    });

    it('200 — ADMIN can GET /admin/campaigns/:id when owner is deactivated', async () => {
      const { accessToken } = await loginAdmin('adminseehide');
      const owner = await createTestUser(prisma, { username: 'hiddenowner' });
      const campaign = await createTestCampaign(prisma, owner.id);
      await prisma.user.update({ where: { id: owner.id }, data: { isActive: false } });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/campaigns/${campaign.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(campaign.id);
    });

    it('200 — member can GET campaign again after owner reactivation', async () => {
      const { accessToken: adminToken } = await loginAdmin('adminreactowner');
      const owner = await createTestUser(prisma, { username: 'reactowner' });
      const member = await createTestUser(prisma, { username: 'reactmember' });
      const campaign = await createTestCampaign(prisma, owner.id);
      await addCampaignMember(prisma, campaign.id, member.id);

      await prisma.user.update({ where: { id: owner.id }, data: { isActive: false } });

      const reactivate = await request(app.getHttpServer())
        .post(`/api/v1/admin/users/${owner.id}/reactivate`)
        .set(authHeader(adminToken));
      expect(reactivate.status).toBe(200);

      const { accessToken } = await loginAsUser(app, member.email, DEFAULT_TEST_PASSWORD);
      const res = await request(app.getHttpServer())
        .get(`/api/v1/campaigns/${campaign.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(campaign.id);
    });
  });
});
