import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HomebrewStatus, HomebrewType, Role } from '@prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../app.module';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { authHeader, loginAsUser } from '../../test/auth-helper';
import { createOfficialHomebrew, createTestHomebrew } from '../../test/factories/homebrew.factory';
import { createTestUser, DEFAULT_TEST_PASSWORD } from '../../test/factories/user.factory';
import { prisma } from '../../test/setup';

describe('Collection auth matrix (integration)', () => {
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
      username: 'collectionadmin',
      role: Role.ADMIN,
      emailVerifiedAt: new Date(),
    });
    const { accessToken } = await loginAsUser(app, admin.email, DEFAULT_TEST_PASSWORD);
    return { admin, accessToken };
  }

  describe('GET /collections', () => {
    it('200 — owner lists own collection', async () => {
      const { user, accessToken } = await loginVerifiedUser('colowner');
      const published = await createTestHomebrew(prisma, user.id, {
        name: 'Collected Feat',
        status: HomebrewStatus.PUBLISHED,
      });
      await prisma.collectionItem.create({
        data: { userId: user.id, homebrewItemId: published.id },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/collections')
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(
        res.body.data.some(
          (item: { homebrewItemId: string }) => item.homebrewItemId === published.id,
        ),
      ).toBe(true);
    });

    it('200 — ADMIN lists own collection', async () => {
      const { accessToken } = await loginAdmin();
      const res = await request(app.getHttpServer())
        .get('/api/v1/collections')
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
    });

    it('200 — otherUser lists only their own collection', async () => {
      const owner = await createTestUser(prisma, { username: 'colowner2' });
      const published = await createTestHomebrew(prisma, owner.id, {
        name: 'Owner Only Collection Item',
        status: HomebrewStatus.PUBLISHED,
      });
      await prisma.collectionItem.create({
        data: { userId: owner.id, homebrewItemId: published.id },
      });

      const { accessToken } = await loginVerifiedUser('colother');
      const res = await request(app.getHttpServer())
        .get('/api/v1/collections')
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(
        res.body.data.some(
          (item: { homebrewItemId: string }) => item.homebrewItemId === published.id,
        ),
      ).toBe(false);
    });

    it('403 — unverified user cannot list collection', async () => {
      const unverified = await createTestUser(prisma, {
        username: 'colunverified',
        emailVerifiedAt: null,
      });
      const { accessToken } = await loginAsUser(app, unverified.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .get('/api/v1/collections')
        .set(authHeader(accessToken));

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('EMAIL_NOT_VERIFIED');
    });

    it('401 — guest cannot list collection', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/collections');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /collections/:homebrewItemId (published)', () => {
    it('201 — owner adds published homebrew', async () => {
      const { user, accessToken } = await loginVerifiedUser('coladdowner');
      const published = await createTestHomebrew(prisma, user.id, {
        name: 'Add Published Feat',
        status: HomebrewStatus.PUBLISHED,
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/collections/${published.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(201);
      expect(res.body.data.homebrewItemId).toBe(published.id);
    });

    it('201 — ADMIN adds published homebrew', async () => {
      const owner = await createTestUser(prisma, { username: 'coladdhbowner' });
      const published = await createTestHomebrew(prisma, owner.id, {
        name: 'Admin Collect Feat',
        status: HomebrewStatus.PUBLISHED,
      });
      const { accessToken } = await loginAdmin();

      const res = await request(app.getHttpServer())
        .post(`/api/v1/collections/${published.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(201);
    });

    it('201 — otherUser adds published homebrew', async () => {
      const owner = await createTestUser(prisma, { username: 'coladdotherowner' });
      const published = await createTestHomebrew(prisma, owner.id, {
        name: 'Other User Collect Feat',
        status: HomebrewStatus.PUBLISHED,
      });
      const { accessToken } = await loginVerifiedUser('coladdother');

      const res = await request(app.getHttpServer())
        .post(`/api/v1/collections/${published.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(201);
    });

    it('403 — unverified user cannot add to collection', async () => {
      const owner = await createTestUser(prisma, { username: 'coladdunvowner' });
      const published = await createTestHomebrew(prisma, owner.id, {
        status: HomebrewStatus.PUBLISHED,
      });
      const unverified = await createTestUser(prisma, {
        username: 'coladdunverified',
        emailVerifiedAt: null,
      });
      const { accessToken } = await loginAsUser(app, unverified.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/collections/${published.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('EMAIL_NOT_VERIFIED');
    });

    it('401 — guest cannot add to collection', async () => {
      const owner = await createTestUser(prisma, { username: 'coladdguestowner' });
      const published = await createTestHomebrew(prisma, owner.id, {
        status: HomebrewStatus.PUBLISHED,
      });

      const res = await request(app.getHttpServer()).post(`/api/v1/collections/${published.id}`);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /collections/:homebrewItemId (draft)', () => {
    it('404 — owner cannot add draft homebrew', async () => {
      const { user, accessToken } = await loginVerifiedUser('coldraftowner');
      const draft = await createTestHomebrew(prisma, user.id, {
        name: 'Draft Feat',
        status: HomebrewStatus.DRAFT,
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/collections/${draft.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(404);
    });

    it('404 — otherUser cannot add draft homebrew', async () => {
      const owner = await createTestUser(prisma, { username: 'coldraftotherowner' });
      const draft = await createTestHomebrew(prisma, owner.id, {
        status: HomebrewStatus.DRAFT,
      });
      const { accessToken } = await loginVerifiedUser('coldraftother');

      const res = await request(app.getHttpServer())
        .post(`/api/v1/collections/${draft.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(404);
    });
  });

  describe('POST /collections/:homebrewItemId (duplicate)', () => {
    it('409 — owner cannot add duplicate item', async () => {
      const { user, accessToken } = await loginVerifiedUser('coldupowner');
      const published = await createTestHomebrew(prisma, user.id, {
        status: HomebrewStatus.PUBLISHED,
      });
      await prisma.collectionItem.create({
        data: { userId: user.id, homebrewItemId: published.id },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/collections/${published.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('ALREADY_IN_COLLECTION');
    });

    it('409 — otherUser cannot add duplicate item', async () => {
      const owner = await createTestUser(prisma, { username: 'coldupotherowner' });
      const published = await createTestHomebrew(prisma, owner.id, {
        status: HomebrewStatus.PUBLISHED,
      });
      const { user, accessToken } = await loginVerifiedUser('coldupother');
      await prisma.collectionItem.create({
        data: { userId: user.id, homebrewItemId: published.id },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/collections/${published.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(409);
    });
  });

  describe('DELETE /collections/:homebrewItemId', () => {
    it('204 — owner removes item from collection', async () => {
      const { user, accessToken } = await loginVerifiedUser('coldelowner');
      const published = await createTestHomebrew(prisma, user.id, {
        status: HomebrewStatus.PUBLISHED,
      });
      await prisma.collectionItem.create({
        data: { userId: user.id, homebrewItemId: published.id },
      });

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/collections/${published.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(204);
    });

    it('204 — ADMIN removes own collection item', async () => {
      const { admin, accessToken } = await loginAdmin();
      const published = await createOfficialHomebrew(prisma, {
        name: 'Admin Delete Official',
        type: HomebrewType.FEAT,
      });
      await prisma.collectionItem.create({
        data: { userId: admin.id, homebrewItemId: published.id },
      });

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/collections/${published.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(204);
    });

    it('403 — otherUser cannot remove item from another user collection', async () => {
      const owner = await createTestUser(prisma, { username: 'coldelotherowner' });
      const published = await createTestHomebrew(prisma, owner.id, {
        status: HomebrewStatus.PUBLISHED,
      });
      await prisma.collectionItem.create({
        data: { userId: owner.id, homebrewItemId: published.id },
      });
      const { accessToken } = await loginVerifiedUser('coldelother');

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/collections/${published.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(403);
    });

    it('403 — unverified user cannot remove from collection', async () => {
      const owner = await createTestUser(prisma, { username: 'coldelunvowner' });
      const published = await createTestHomebrew(prisma, owner.id, {
        status: HomebrewStatus.PUBLISHED,
      });
      await prisma.collectionItem.create({
        data: { userId: owner.id, homebrewItemId: published.id },
      });
      const unverified = await createTestUser(prisma, {
        username: 'coldelunverified',
        emailVerifiedAt: null,
      });
      const { accessToken } = await loginAsUser(app, unverified.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/collections/${published.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(403);
    });

    it('401 — guest cannot remove from collection', async () => {
      const owner = await createTestUser(prisma, { username: 'coldelguestowner' });
      const published = await createTestHomebrew(prisma, owner.id, {
        status: HomebrewStatus.PUBLISHED,
      });

      const res = await request(app.getHttpServer()).delete(`/api/v1/collections/${published.id}`);

      expect(res.status).toBe(401);
    });
  });

  describe('isUnpublished flag', () => {
    it('returns isUnpublished true when homebrew was unpublished after collection add', async () => {
      const { user, accessToken } = await loginVerifiedUser('colunpub');
      const published = await createTestHomebrew(prisma, user.id, {
        name: 'Unpublished Later',
        status: HomebrewStatus.PUBLISHED,
      });
      await prisma.collectionItem.create({
        data: { userId: user.id, homebrewItemId: published.id },
      });
      await prisma.homebrewItem.update({
        where: { id: published.id },
        data: { status: HomebrewStatus.DRAFT },
      });

      const res = await request(app.getHttpServer())
        .get('/api/v1/collections')
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      const item = res.body.data.find(
        (entry: { homebrewItemId: string }) => entry.homebrewItemId === published.id,
      );
      expect(item.isUnpublished).toBe(true);
      expect(item.status).toBe(HomebrewStatus.DRAFT);
    });
  });
});
