import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../../app.module';
import { GlobalExceptionFilter } from '../../common/filters/global-exception.filter';
import { authHeader, loginAsUser } from '../../../test/auth-helper';
import { addCampaignMember, createTestCampaign } from '../../../test/factories/campaign.factory';
import { createTestUser, DEFAULT_TEST_PASSWORD } from '../../../test/factories/user.factory';
import { prisma } from '../../../test/setup';

describe('DmNotesController (integration)', () => {
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

  function dmNotesPath(campaignId: string, suffix = '') {
    return `/api/v1/campaigns/${campaignId}/dm-notes${suffix}`;
  }

  describe('GET /campaigns/:campaignId/dm-notes', () => {
    it('200 — DM lists notes sorted by sortOrder', async () => {
      const dm = await createTestUser(prisma, { username: 'dmnotelist' });
      const campaign = await createTestCampaign(prisma, dm.id);
      await prisma.dmNote.createMany({
        data: [
          { campaignId: campaign.id, title: 'Second', sortOrder: 1 },
          { campaignId: campaign.id, title: 'First', sortOrder: 0 },
        ],
      });
      const { accessToken } = await loginAsUser(app, dm.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .get(dmNotesPath(campaign.id))
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].title).toBe('First');
      expect(res.body.data[1].title).toBe('Second');
    });

    it('404 — campaign member cannot list dm notes', async () => {
      const dm = await createTestUser(prisma, { username: 'dmhiddennotes' });
      const player = await createTestUser(prisma, { username: 'playernotes' });
      const campaign = await createTestCampaign(prisma, dm.id);
      await addCampaignMember(prisma, campaign.id, player.id);
      await prisma.dmNote.create({
        data: { campaignId: campaign.id, title: 'Secret', sortOrder: 0 },
      });
      const { accessToken } = await loginAsUser(app, player.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .get(dmNotesPath(campaign.id))
        .set(authHeader(accessToken));

      expect(res.status).toBe(404);
    });

    it('404 — outsider cannot list dm notes', async () => {
      const dm = await createTestUser(prisma, { username: 'dmoutsiderlist' });
      const stranger = await createTestUser(prisma, { username: 'strangernotes' });
      const campaign = await createTestCampaign(prisma, dm.id);
      const { accessToken } = await loginAsUser(app, stranger.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .get(dmNotesPath(campaign.id))
        .set(authHeader(accessToken));

      expect(res.status).toBe(404);
    });
  });

  describe('POST /campaigns/:campaignId/dm-notes', () => {
    it('201 — DM creates note with auto sortOrder', async () => {
      const dm = await createTestUser(prisma, { username: 'dmnotecreate' });
      const campaign = await createTestCampaign(prisma, dm.id);
      await prisma.dmNote.create({
        data: { campaignId: campaign.id, title: 'Existing', sortOrder: 2 },
      });
      const { accessToken } = await loginAsUser(app, dm.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .post(dmNotesPath(campaign.id))
        .set(authHeader(accessToken))
        .send({
          title: 'Session 5 Notes',
          content: '## Key NPCs',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        title: 'Session 5 Notes',
        content: '## Key NPCs',
        campaignId: campaign.id,
        sortOrder: 3,
      });
    });

    it('403 — unverified user cannot create dm note', async () => {
      const unverified = await createTestUser(prisma, {
        username: 'unverifieddmnote',
        emailVerifiedAt: null,
      });
      const campaign = await createTestCampaign(prisma, unverified.id);
      const { accessToken } = await loginAsUser(app, unverified.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .post(dmNotesPath(campaign.id))
        .set(authHeader(accessToken))
        .send({ title: 'Blocked Note' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('EMAIL_NOT_VERIFIED');
    });

    it('404 — member cannot create dm note', async () => {
      const dm = await createTestUser(prisma, { username: 'dmnotepost' });
      const player = await createTestUser(prisma, { username: 'playernotecreate' });
      const campaign = await createTestCampaign(prisma, dm.id);
      await addCampaignMember(prisma, campaign.id, player.id);
      const { accessToken } = await loginAsUser(app, player.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .post(dmNotesPath(campaign.id))
        .set(authHeader(accessToken))
        .send({ title: 'Player Note' });

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /campaigns/:campaignId/dm-notes/:noteId', () => {
    it('200 — DM updates note', async () => {
      const dm = await createTestUser(prisma, { username: 'dmnoteupdate' });
      const campaign = await createTestCampaign(prisma, dm.id);
      const note = await prisma.dmNote.create({
        data: { campaignId: campaign.id, title: 'Old Title', sortOrder: 0 },
      });
      const { accessToken } = await loginAsUser(app, dm.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(dmNotesPath(campaign.id, `/${note.id}`))
        .set(authHeader(accessToken))
        .send({ title: 'Updated Title', content: 'New content' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.content).toBe('New content');
    });

    it('404 — member cannot update dm note', async () => {
      const dm = await createTestUser(prisma, { username: 'dmnoteupdeny' });
      const player = await createTestUser(prisma, { username: 'playernoteupdate' });
      const campaign = await createTestCampaign(prisma, dm.id);
      await addCampaignMember(prisma, campaign.id, player.id);
      const note = await prisma.dmNote.create({
        data: { campaignId: campaign.id, title: 'DM Only', sortOrder: 0 },
      });
      const { accessToken } = await loginAsUser(app, player.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(dmNotesPath(campaign.id, `/${note.id}`))
        .set(authHeader(accessToken))
        .send({ title: 'Hacked' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /campaigns/:campaignId/dm-notes/:noteId', () => {
    it('204 — DM deletes note', async () => {
      const dm = await createTestUser(prisma, { username: 'dmnotedelete' });
      const campaign = await createTestCampaign(prisma, dm.id);
      const note = await prisma.dmNote.create({
        data: { campaignId: campaign.id, title: 'To Delete', sortOrder: 0 },
      });
      const { accessToken } = await loginAsUser(app, dm.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .delete(dmNotesPath(campaign.id, `/${note.id}`))
        .set(authHeader(accessToken));

      expect(res.status).toBe(204);

      const remaining = await prisma.dmNote.count({ where: { campaignId: campaign.id } });
      expect(remaining).toBe(0);
    });

    it('404 — outsider cannot delete dm note', async () => {
      const dm = await createTestUser(prisma, { username: 'dmnotedeldeny' });
      const stranger = await createTestUser(prisma, { username: 'strangerdelnote' });
      const campaign = await createTestCampaign(prisma, dm.id);
      const note = await prisma.dmNote.create({
        data: { campaignId: campaign.id, title: 'Protected', sortOrder: 0 },
      });
      const { accessToken } = await loginAsUser(app, stranger.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .delete(dmNotesPath(campaign.id, `/${note.id}`))
        .set(authHeader(accessToken));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /campaigns/:campaignId/dm-notes/reorder', () => {
    it('200 — DM reorders all notes atomically', async () => {
      const dm = await createTestUser(prisma, { username: 'dmnotereorder' });
      const campaign = await createTestCampaign(prisma, dm.id);
      const note1 = await prisma.dmNote.create({
        data: { campaignId: campaign.id, title: 'Note 1', sortOrder: 0 },
      });
      const note2 = await prisma.dmNote.create({
        data: { campaignId: campaign.id, title: 'Note 2', sortOrder: 1 },
      });
      const note3 = await prisma.dmNote.create({
        data: { campaignId: campaign.id, title: 'Note 3', sortOrder: 2 },
      });
      const { accessToken } = await loginAsUser(app, dm.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(dmNotesPath(campaign.id, '/reorder'))
        .set(authHeader(accessToken))
        .send({ noteIds: [note3.id, note1.id, note2.id] });

      expect(res.status).toBe(200);
      expect(res.body.data.map((note: { id: string }) => note.id)).toEqual([
        note3.id,
        note1.id,
        note2.id,
      ]);
      expect(res.body.data.map((note: { sortOrder: number }) => note.sortOrder)).toEqual([0, 1, 2]);
    });

    it('400 — reorder rejects incomplete noteIds set', async () => {
      const dm = await createTestUser(prisma, { username: 'dmreorderbad' });
      const campaign = await createTestCampaign(prisma, dm.id);
      const note1 = await prisma.dmNote.create({
        data: { campaignId: campaign.id, title: 'Note A', sortOrder: 0 },
      });
      await prisma.dmNote.create({
        data: { campaignId: campaign.id, title: 'Note B', sortOrder: 1 },
      });
      const { accessToken } = await loginAsUser(app, dm.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(dmNotesPath(campaign.id, '/reorder'))
        .set(authHeader(accessToken))
        .send({ noteIds: [note1.id] });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('noteIds must contain exactly all notes for this campaign');
    });

    it('404 — member cannot reorder dm notes', async () => {
      const dm = await createTestUser(prisma, { username: 'dmreorderdeny' });
      const player = await createTestUser(prisma, { username: 'playerreorder' });
      const campaign = await createTestCampaign(prisma, dm.id);
      await addCampaignMember(prisma, campaign.id, player.id);
      const note = await prisma.dmNote.create({
        data: { campaignId: campaign.id, title: 'Note', sortOrder: 0 },
      });
      const { accessToken } = await loginAsUser(app, player.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(dmNotesPath(campaign.id, '/reorder'))
        .set(authHeader(accessToken))
        .send({ noteIds: [note.id] });

      expect(res.status).toBe(404);
    });
  });

  describe('DM notes CRUD flow', () => {
    it('create three notes → reorder → delete one', async () => {
      const dm = await createTestUser(prisma, { username: 'dmnoteflow' });
      const campaign = await createTestCampaign(prisma, dm.id);
      const { accessToken } = await loginAsUser(app, dm.email, DEFAULT_TEST_PASSWORD);

      const createdIds: string[] = [];
      for (const title of ['Alpha', 'Beta', 'Gamma']) {
        const res = await request(app.getHttpServer())
          .post(dmNotesPath(campaign.id))
          .set(authHeader(accessToken))
          .send({ title });
        expect(res.status).toBe(201);
        createdIds.push(res.body.data.id);
      }

      const reorderRes = await request(app.getHttpServer())
        .patch(dmNotesPath(campaign.id, '/reorder'))
        .set(authHeader(accessToken))
        .send({ noteIds: [createdIds[2], createdIds[0], createdIds[1]] });

      expect(reorderRes.status).toBe(200);
      expect(reorderRes.body.data.map((note: { title: string }) => note.title)).toEqual([
        'Gamma',
        'Alpha',
        'Beta',
      ]);

      const deleteRes = await request(app.getHttpServer())
        .delete(dmNotesPath(campaign.id, `/${createdIds[0]}`))
        .set(authHeader(accessToken));

      expect(deleteRes.status).toBe(204);

      const listRes = await request(app.getHttpServer())
        .get(dmNotesPath(campaign.id))
        .set(authHeader(accessToken));

      expect(listRes.status).toBe(200);
      expect(listRes.body.data).toHaveLength(2);
      expect(listRes.body.data.map((note: { title: string }) => note.title)).toEqual([
        'Gamma',
        'Beta',
      ]);
    });
  });
});
