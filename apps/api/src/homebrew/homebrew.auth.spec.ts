import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HomebrewStatus, HomebrewType, Role } from '@prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../app.module';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { authHeader, loginAsUser } from '../../test/auth-helper';
import {
  createOfficialHomebrew,
  createTestHomebrew,
  DEFAULT_FEAT_DATA,
  DEFAULT_MAGIC_ITEM_DATA,
} from '../../test/factories/homebrew.factory';
import { createTestUser, DEFAULT_TEST_PASSWORD } from '../../test/factories/user.factory';
import { prisma } from '../../test/setup';

const featCreatePayload = {
  name: 'Custom Feat',
  type: HomebrewType.FEAT,
  description: 'A custom feat for testing',
  data: DEFAULT_FEAT_DATA,
};

describe('Homebrew auth matrix (integration)', () => {
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

  async function loginAdmin() {
    const admin = await createTestUser(prisma, {
      username: 'homebrewadmin',
      role: Role.ADMIN,
      emailVerifiedAt: new Date(),
    });
    const { accessToken } = await loginAsUser(app, admin.email, DEFAULT_TEST_PASSWORD);
    return { admin, accessToken };
  }

  describe('POST /homebrew', () => {
    it('201 — ADMIN creates homebrew', async () => {
      const { accessToken } = await loginAdmin();
      const res = await request(app.getHttpServer())
        .post('/api/v1/homebrew')
        .set(authHeader(accessToken))
        .send(featCreatePayload);

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe(HomebrewStatus.DRAFT);
      expect(res.body.data.source).toBe('HOMEBREW');
    });

    it('201 — owner creates homebrew', async () => {
      const { accessToken } = await loginVerifiedUser('hbowner');
      const res = await request(app.getHttpServer())
        .post('/api/v1/homebrew')
        .set(authHeader(accessToken))
        .send({ ...featCreatePayload, name: 'Owner Feat' });

      expect(res.status).toBe(201);
    });

    it('201 — otherUser creates homebrew', async () => {
      const { accessToken } = await loginVerifiedUser('hbother');
      const res = await request(app.getHttpServer())
        .post('/api/v1/homebrew')
        .set(authHeader(accessToken))
        .send({ ...featCreatePayload, name: 'Other User Feat' });

      expect(res.status).toBe(201);
    });

    it('403 — unverified user cannot create homebrew', async () => {
      const unverified = await createTestUser(prisma, {
        username: 'hbunverified',
        emailVerifiedAt: null,
      });
      const { accessToken } = await loginAsUser(app, unverified.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .post('/api/v1/homebrew')
        .set(authHeader(accessToken))
        .send(featCreatePayload);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('EMAIL_NOT_VERIFIED');
    });

    it('401 — guest cannot create homebrew', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/homebrew')
        .send(featCreatePayload);

      expect(res.status).toBe(401);
    });

    it('400 — invalid data returns details', async () => {
      const { accessToken } = await loginVerifiedUser('hbinvalid');
      const res = await request(app.getHttpServer())
        .post('/api/v1/homebrew')
        .set(authHeader(accessToken))
        .send({
          name: 'Bad Feat',
          type: HomebrewType.FEAT,
          data: { category: 'General' },
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: expect.stringContaining('data.') }),
        ]),
      );
    });
  });

  describe('GET /homebrew (gallery)', () => {
    it('200 — guest reads published gallery', async () => {
      const owner = await createTestUser(prisma, { username: 'galleryowner' });
      await createTestHomebrew(prisma, owner.id, {
        name: 'Published Gallery Feat',
        status: HomebrewStatus.PUBLISHED,
      });
      await createTestHomebrew(prisma, owner.id, {
        name: 'Draft Hidden Feat',
        status: HomebrewStatus.DRAFT,
      });

      const res = await request(app.getHttpServer()).get('/api/v1/homebrew');

      expect(res.status).toBe(200);
      expect(
        res.body.data.some((item: { name: string }) => item.name === 'Published Gallery Feat'),
      ).toBe(true);
      expect(
        res.body.data.some((item: { name: string }) => item.name === 'Draft Hidden Feat'),
      ).toBe(false);
    });

    it('200 — verified user reads gallery', async () => {
      const { accessToken } = await loginVerifiedUser('galleryuser');
      const res = await request(app.getHttpServer())
        .get('/api/v1/homebrew')
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
    });
  });

  describe('GET /homebrew/my-creations', () => {
    it('200 — owner lists own creations', async () => {
      const { user, accessToken } = await loginVerifiedUser('mycreationsowner');
      await createTestHomebrew(prisma, user.id, { name: 'My Draft Feat' });

      const res = await request(app.getHttpServer())
        .get('/api/v1/homebrew/my-creations')
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.some((item: { name: string }) => item.name === 'My Draft Feat')).toBe(
        true,
      );
    });

    it('200 — ADMIN lists own creations', async () => {
      const { accessToken } = await loginAdmin();
      const res = await request(app.getHttpServer())
        .get('/api/v1/homebrew/my-creations')
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
    });

    it('200 — otherUser lists only their own creations', async () => {
      const owner = await createTestUser(prisma, { username: 'creationsowner2' });
      await createTestHomebrew(prisma, owner.id, { name: 'Not Visible To Other' });

      const { user, accessToken } = await loginVerifiedUser('creationsother');
      await createTestHomebrew(prisma, user.id, { name: 'Other User Creation' });

      const res = await request(app.getHttpServer())
        .get('/api/v1/homebrew/my-creations')
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(
        res.body.data.some((item: { name: string }) => item.name === 'Other User Creation'),
      ).toBe(true);
      expect(
        res.body.data.some((item: { name: string }) => item.name === 'Not Visible To Other'),
      ).toBe(false);
    });

    it('403 — unverified user cannot list my-creations', async () => {
      const unverified = await createTestUser(prisma, {
        username: 'mycreationsunverified',
        emailVerifiedAt: null,
      });
      const { accessToken } = await loginAsUser(app, unverified.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .get('/api/v1/homebrew/my-creations')
        .set(authHeader(accessToken));

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('EMAIL_NOT_VERIFIED');
    });

    it('401 — guest cannot list my-creations', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/homebrew/my-creations');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /homebrew/:id (published)', () => {
    it('200 — guest reads published homebrew', async () => {
      const owner = await createTestUser(prisma, { username: 'pubdetailowner' });
      const item = await createTestHomebrew(prisma, owner.id, {
        name: 'Published Detail Feat',
        status: HomebrewStatus.PUBLISHED,
      });

      const res = await request(app.getHttpServer()).get(`/api/v1/homebrew/${item.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Published Detail Feat');
      expect(res.body.data).toHaveProperty('data');
    });
  });

  describe('GET /homebrew/:id (draft)', () => {
    it('200 — owner reads own draft', async () => {
      const { user, accessToken } = await loginVerifiedUser('draftowner');
      const item = await createTestHomebrew(prisma, user.id, {
        name: 'Secret Draft',
        status: HomebrewStatus.DRAFT,
      });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/homebrew/${item.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
    });

    it('404 — otherUser cannot read draft', async () => {
      const owner = await createTestUser(prisma, { username: 'draftowner2' });
      const item = await createTestHomebrew(prisma, owner.id, {
        name: 'Hidden Draft',
        status: HomebrewStatus.DRAFT,
      });
      const { accessToken } = await loginVerifiedUser('draftstranger');

      const res = await request(app.getHttpServer())
        .get(`/api/v1/homebrew/${item.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(404);
    });

    it('404 — unverified user cannot read draft', async () => {
      const owner = await createTestUser(prisma, { username: 'draftowner3' });
      const item = await createTestHomebrew(prisma, owner.id, {
        name: 'Hidden Draft 2',
        status: HomebrewStatus.DRAFT,
      });
      const unverified = await createTestUser(prisma, {
        username: 'draftunverified',
        emailVerifiedAt: null,
      });
      const { accessToken } = await loginAsUser(app, unverified.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/homebrew/${item.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(404);
    });

    it('404 — guest cannot read draft', async () => {
      const owner = await createTestUser(prisma, { username: 'draftowner4' });
      const item = await createTestHomebrew(prisma, owner.id, {
        name: 'Hidden Draft 3',
        status: HomebrewStatus.DRAFT,
      });

      const res = await request(app.getHttpServer()).get(`/api/v1/homebrew/${item.id}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /homebrew/:id', () => {
    async function setupOwnerDraft() {
      const { user, accessToken } = await loginVerifiedUser(`patchowner${Date.now()}`);
      const item = await createTestHomebrew(prisma, user.id, {
        name: 'Patch Target',
        status: HomebrewStatus.DRAFT,
      });
      return { user, accessToken, item };
    }

    it('200 — owner updates homebrew', async () => {
      const { accessToken, item } = await setupOwnerDraft();
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/homebrew/${item.id}`)
        .set(authHeader(accessToken))
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('200 — ADMIN updates homebrew', async () => {
      const owner = await createTestUser(prisma, { username: 'patchadminowner' });
      const item = await createTestHomebrew(prisma, owner.id, { name: 'Admin Patch Target' });
      const { accessToken } = await loginAdmin();

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/homebrew/${item.id}`)
        .set(authHeader(accessToken))
        .send({ name: 'Admin Updated' });

      expect(res.status).toBe(200);
    });

    it('403 — otherUser cannot update homebrew', async () => {
      const owner = await createTestUser(prisma, { username: 'patchotherowner' });
      const item = await createTestHomebrew(prisma, owner.id, {
        name: 'Protected Feat',
        status: HomebrewStatus.PUBLISHED,
      });
      const { accessToken } = await loginVerifiedUser('patchotheruser');

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/homebrew/${item.id}`)
        .set(authHeader(accessToken))
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
    });

    it('403 — unverified user cannot update homebrew', async () => {
      const owner = await createTestUser(prisma, { username: 'patchunverifiedowner' });
      const item = await createTestHomebrew(prisma, owner.id, { name: 'Unverified Patch Target' });
      const unverified = await createTestUser(prisma, {
        username: 'patchunverified',
        emailVerifiedAt: null,
      });
      const { accessToken } = await loginAsUser(app, unverified.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/homebrew/${item.id}`)
        .set(authHeader(accessToken))
        .send({ name: 'Blocked' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('EMAIL_NOT_VERIFIED');
    });

    it('401 — guest cannot update homebrew', async () => {
      const owner = await createTestUser(prisma, { username: 'patchguestowner' });
      const item = await createTestHomebrew(prisma, owner.id, { name: 'Guest Patch Target' });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/homebrew/${item.id}`)
        .send({ name: 'Guest Hack' });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /homebrew/:id', () => {
    it('204 — owner deletes homebrew', async () => {
      const { user, accessToken } = await loginVerifiedUser('deleteowner');
      const item = await createTestHomebrew(prisma, user.id, { name: 'Delete Me' });

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/homebrew/${item.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(204);
    });

    it('204 — ADMIN deletes homebrew', async () => {
      const owner = await createTestUser(prisma, { username: 'deleteadminowner' });
      const item = await createTestHomebrew(prisma, owner.id, { name: 'Admin Delete Target' });
      const { accessToken } = await loginAdmin();

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/homebrew/${item.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(204);
    });

    it('403 — otherUser cannot delete homebrew', async () => {
      const owner = await createTestUser(prisma, { username: 'deleteotherowner' });
      const item = await createTestHomebrew(prisma, owner.id, {
        name: 'Protected Delete',
        status: HomebrewStatus.PUBLISHED,
      });
      const { accessToken } = await loginVerifiedUser('deleteotheruser');

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/homebrew/${item.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(403);
    });

    it('403 — unverified user cannot delete homebrew', async () => {
      const owner = await createTestUser(prisma, { username: 'deleteunverifiedowner' });
      const item = await createTestHomebrew(prisma, owner.id, { name: 'Unverified Delete Target' });
      const unverified = await createTestUser(prisma, {
        username: 'deleteunverified',
        emailVerifiedAt: null,
      });
      const { accessToken } = await loginAsUser(app, unverified.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/homebrew/${item.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(403);
    });

    it('401 — guest cannot delete homebrew', async () => {
      const owner = await createTestUser(prisma, { username: 'deleteguestowner' });
      const item = await createTestHomebrew(prisma, owner.id, { name: 'Guest Delete Target' });

      const res = await request(app.getHttpServer()).delete(`/api/v1/homebrew/${item.id}`);

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /homebrew/:id/publish', () => {
    it('200 — owner publishes draft', async () => {
      const { user, accessToken } = await loginVerifiedUser('publishowner');
      const item = await createTestHomebrew(prisma, user.id, {
        name: 'Publish Me',
        status: HomebrewStatus.DRAFT,
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/homebrew/${item.id}/publish`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(HomebrewStatus.PUBLISHED);
      expect(res.body.data.publishedAt).toBeTruthy();
    });

    it('200 — ADMIN publishes draft', async () => {
      const owner = await createTestUser(prisma, { username: 'publishadminowner' });
      const item = await createTestHomebrew(prisma, owner.id, {
        name: 'Admin Publish Target',
        status: HomebrewStatus.DRAFT,
      });
      const { accessToken } = await loginAdmin();

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/homebrew/${item.id}/publish`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
    });

    it('404 — otherUser cannot publish hidden draft', async () => {
      const owner = await createTestUser(prisma, { username: 'publishotherowner' });
      const item = await createTestHomebrew(prisma, owner.id, {
        name: 'Protected Publish',
        status: HomebrewStatus.DRAFT,
      });
      const { accessToken } = await loginVerifiedUser('publishotheruser');

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/homebrew/${item.id}/publish`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(404);
    });

    it('403 — unverified user cannot publish', async () => {
      const owner = await createTestUser(prisma, { username: 'publishunverifiedowner' });
      const item = await createTestHomebrew(prisma, owner.id, {
        name: 'Unverified Publish Target',
        status: HomebrewStatus.DRAFT,
      });
      const unverified = await createTestUser(prisma, {
        username: 'publishunverified',
        emailVerifiedAt: null,
      });
      const { accessToken } = await loginAsUser(app, unverified.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/homebrew/${item.id}/publish`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(403);
    });

    it('401 — guest cannot publish', async () => {
      const owner = await createTestUser(prisma, { username: 'publishguestowner' });
      const item = await createTestHomebrew(prisma, owner.id, {
        name: 'Guest Publish Target',
        status: HomebrewStatus.DRAFT,
      });

      const res = await request(app.getHttpServer()).patch(`/api/v1/homebrew/${item.id}/publish`);

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /homebrew/:id/unpublish', () => {
    it('200 — owner unpublishes', async () => {
      const { user, accessToken } = await loginVerifiedUser('unpublishowner');
      const item = await createTestHomebrew(prisma, user.id, {
        name: 'Unpublish Me',
        status: HomebrewStatus.PUBLISHED,
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/homebrew/${item.id}/unpublish`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(HomebrewStatus.DRAFT);
    });

    it('200 — ADMIN unpublishes', async () => {
      const owner = await createTestUser(prisma, { username: 'unpublishadminowner' });
      const item = await createTestHomebrew(prisma, owner.id, {
        name: 'Admin Unpublish Target',
        status: HomebrewStatus.PUBLISHED,
      });
      const { accessToken } = await loginAdmin();

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/homebrew/${item.id}/unpublish`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
    });

    it('403 — otherUser cannot unpublish', async () => {
      const owner = await createTestUser(prisma, { username: 'unpublishotherowner' });
      const item = await createTestHomebrew(prisma, owner.id, {
        name: 'Protected Unpublish',
        status: HomebrewStatus.PUBLISHED,
      });
      const { accessToken } = await loginVerifiedUser('unpublishotheruser');

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/homebrew/${item.id}/unpublish`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(403);
    });

    it('403 — unverified user cannot unpublish', async () => {
      const owner = await createTestUser(prisma, { username: 'unpublishunverifiedowner' });
      const item = await createTestHomebrew(prisma, owner.id, {
        name: 'Unverified Unpublish Target',
        status: HomebrewStatus.PUBLISHED,
      });
      const unverified = await createTestUser(prisma, {
        username: 'unpublishunverified',
        emailVerifiedAt: null,
      });
      const { accessToken } = await loginAsUser(app, unverified.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/homebrew/${item.id}/unpublish`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(403);
    });

    it('401 — guest cannot unpublish', async () => {
      const owner = await createTestUser(prisma, { username: 'unpublishguestowner' });
      const item = await createTestHomebrew(prisma, owner.id, {
        name: 'Guest Unpublish Target',
        status: HomebrewStatus.PUBLISHED,
      });

      const res = await request(app.getHttpServer()).patch(`/api/v1/homebrew/${item.id}/unpublish`);

      expect(res.status).toBe(401);
    });
  });

  describe('Official content PATCH/DELETE', () => {
    it('200 — ADMIN patches official content', async () => {
      const item = await createOfficialHomebrew(prisma, { name: 'Official Fireball Clone' });
      const { accessToken } = await loginAdmin();

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/homebrew/${item.id}`)
        .set(authHeader(accessToken))
        .send({ description: 'Updated by admin' });

      expect(res.status).toBe(200);
    });

    it('403 — owner cannot patch official content', async () => {
      const item = await createOfficialHomebrew(prisma, { name: 'Official Protected Item' });
      const { accessToken } = await loginVerifiedUser('officialpatchowner');

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/homebrew/${item.id}`)
        .set(authHeader(accessToken))
        .send({ description: 'Should fail' });

      expect(res.status).toBe(403);
    });

    it('403 — otherUser cannot patch official content', async () => {
      const item = await createOfficialHomebrew(prisma, { name: 'Official Protected Item 2' });
      const { accessToken } = await loginVerifiedUser('officialpatchother');

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/homebrew/${item.id}`)
        .set(authHeader(accessToken))
        .send({ description: 'Should fail' });

      expect(res.status).toBe(403);
    });

    it('403 — unverified user cannot patch official content', async () => {
      const item = await createOfficialHomebrew(prisma, { name: 'Official Protected Item 3' });
      const unverified = await createTestUser(prisma, {
        username: 'officialpatchunverified',
        emailVerifiedAt: null,
      });
      const { accessToken } = await loginAsUser(app, unverified.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/homebrew/${item.id}`)
        .set(authHeader(accessToken))
        .send({ description: 'Should fail' });

      expect(res.status).toBe(403);
    });

    it('401 — guest cannot patch official content', async () => {
      const item = await createOfficialHomebrew(prisma, { name: 'Official Protected Item 4' });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/homebrew/${item.id}`)
        .send({ description: 'Should fail' });

      expect(res.status).toBe(401);
    });

    it('204 — ADMIN deletes official content', async () => {
      const item = await createOfficialHomebrew(prisma, { name: 'Official Delete Target' });
      const { accessToken } = await loginAdmin();

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/homebrew/${item.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(204);
    });

    it('403 — owner cannot delete official content', async () => {
      const item = await createOfficialHomebrew(prisma, { name: 'Official Delete Protected' });
      const { accessToken } = await loginVerifiedUser('officialdeleteowner');

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/homebrew/${item.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(403);
    });
  });

  describe('Publish flow integration', () => {
    it('published homebrew appears in gallery', async () => {
      const { user, accessToken } = await loginVerifiedUser('flowowner');
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/homebrew')
        .set(authHeader(accessToken))
        .send({
          name: 'Flow Magic Item',
          type: HomebrewType.MAGIC_ITEM,
          data: DEFAULT_MAGIC_ITEM_DATA,
        });

      expect(createRes.status).toBe(201);
      const itemId = createRes.body.data.id as string;

      const publishRes = await request(app.getHttpServer())
        .patch(`/api/v1/homebrew/${itemId}/publish`)
        .set(authHeader(accessToken));

      expect(publishRes.status).toBe(200);

      const galleryRes = await request(app.getHttpServer()).get(
        '/api/v1/homebrew?search=Flow Magic',
      );

      expect(galleryRes.status).toBe(200);
      expect(galleryRes.body.data.some((item: { id: string }) => item.id === itemId)).toBe(true);
      expect(createRes.body.data.ownerId).toBe(user.id);
    });
  });
});
