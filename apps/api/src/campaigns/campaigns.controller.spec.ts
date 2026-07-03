import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../app.module';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { authHeader, loginAsUser } from '../../test/auth-helper';
import { addCampaignMember, createTestCampaign } from '../../test/factories/campaign.factory';
import { createTestUser, DEFAULT_TEST_PASSWORD } from '../../test/factories/user.factory';
import { prisma } from '../../test/setup';

describe('CampaignsController (integration)', () => {
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

  describe('POST /campaigns', () => {
    it('201 — verified user creates campaign', async () => {
      const dm = await createTestUser(prisma, { username: 'dmcreate' });
      const { accessToken } = await loginAsUser(app, dm.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .post('/api/v1/campaigns')
        .set(authHeader(accessToken))
        .send({
          name: 'Curse of Strahd Campaign',
          description: 'A gothic horror adventure',
          setting: 'Barovia',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        name: 'Curse of Strahd Campaign',
        description: 'A gothic horror adventure',
        setting: 'Barovia',
        ownerId: dm.id,
        inviteToken: null,
      });
    });

    it('403 — unverified user cannot create campaign', async () => {
      const unverified = await createTestUser(prisma, {
        username: 'unverifieddm',
        emailVerifiedAt: null,
      });
      const { accessToken } = await loginAsUser(app, unverified.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .post('/api/v1/campaigns')
        .set(authHeader(accessToken))
        .send({ name: 'Blocked Campaign' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('EMAIL_NOT_VERIFIED');
    });
  });

  describe('GET /campaigns/:id', () => {
    it('200 — owner reads campaign', async () => {
      const dm = await createTestUser(prisma, { username: 'dmread' });
      const campaign = await createTestCampaign(prisma, dm.id);
      const { accessToken } = await loginAsUser(app, dm.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/campaigns/${campaign.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(campaign.id);
      expect(res.body.data.memberCount).toBe(1);
    });

    it('200 — member reads campaign', async () => {
      const dm = await createTestUser(prisma, { username: 'dmmemberread' });
      const player = await createTestUser(prisma, { username: 'playermember' });
      const campaign = await createTestCampaign(prisma, dm.id);
      await addCampaignMember(prisma, campaign.id, player.id);

      const { accessToken } = await loginAsUser(app, player.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/campaigns/${campaign.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(campaign.id);
    });

    it('404 — outsider cannot read campaign', async () => {
      const dm = await createTestUser(prisma, { username: 'dmhidden' });
      const stranger = await createTestUser(prisma, { username: 'strangerread' });
      const campaign = await createTestCampaign(prisma, dm.id);
      const { accessToken } = await loginAsUser(app, stranger.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/campaigns/${campaign.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /campaigns/:id', () => {
    it('200 — owner updates campaign', async () => {
      const dm = await createTestUser(prisma, { username: 'dmupdate' });
      const campaign = await createTestCampaign(prisma, dm.id);
      const { accessToken } = await loginAsUser(app, dm.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/campaigns/${campaign.id}`)
        .set(authHeader(accessToken))
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('403 — member cannot update campaign', async () => {
      const dm = await createTestUser(prisma, { username: 'dmpatchdeny' });
      const player = await createTestUser(prisma, { username: 'playerpatch' });
      const campaign = await createTestCampaign(prisma, dm.id);
      await addCampaignMember(prisma, campaign.id, player.id);
      const { accessToken } = await loginAsUser(app, player.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/campaigns/${campaign.id}`)
        .set(authHeader(accessToken))
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN');
    });
  });

  describe('invite flow', () => {
    it('DM regenerate invite → player joins → member list', async () => {
      const dm = await createTestUser(prisma, { username: 'dminvite' });
      const player = await createTestUser(prisma, { username: 'playerjoin' });
      const campaign = await createTestCampaign(prisma, dm.id);
      const dmAuth = await loginAsUser(app, dm.email, DEFAULT_TEST_PASSWORD);
      const playerAuth = await loginAsUser(app, player.email, DEFAULT_TEST_PASSWORD);

      const regenerateRes = await request(app.getHttpServer())
        .post(`/api/v1/campaigns/${campaign.id}/invite/regenerate`)
        .set(authHeader(dmAuth.accessToken));

      expect(regenerateRes.status).toBe(200);
      expect(regenerateRes.body.data.inviteToken).toBeDefined();
      expect(regenerateRes.body.data.inviteUrl).toContain('/invite/');

      const token = regenerateRes.body.data.inviteToken as string;

      const previewRes = await request(app.getHttpServer())
        .get(`/api/v1/invite/${token}`)
        .set(authHeader(playerAuth.accessToken));

      expect(previewRes.status).toBe(200);
      expect(previewRes.body.data.campaignName).toBe(campaign.name);

      const joinRes = await request(app.getHttpServer())
        .post(`/api/v1/invite/${token}/join`)
        .set(authHeader(playerAuth.accessToken));

      expect(joinRes.status).toBe(201);
      expect(joinRes.body.data.campaignId).toBe(campaign.id);

      const membersRes = await request(app.getHttpServer())
        .get(`/api/v1/campaigns/${campaign.id}/members`)
        .set(authHeader(dmAuth.accessToken));

      expect(membersRes.status).toBe(200);
      expect(membersRes.body.data).toHaveLength(2);
      expect(membersRes.body.data[0]).toMatchObject({
        userId: dm.id,
        role: 'DM',
      });
      expect(membersRes.body.data[1]).toMatchObject({
        userId: player.id,
        role: 'PLAYER',
      });
      expect(membersRes.body.data[0].email).toBeUndefined();
    });

    it('409 — duplicate join', async () => {
      const dm = await createTestUser(prisma, { username: 'dmdupjoin' });
      const player = await createTestUser(prisma, { username: 'playerdup' });
      const campaign = await createTestCampaign(prisma, dm.id, {
        inviteToken: 'fixed-invite-token-for-test',
      });
      await addCampaignMember(prisma, campaign.id, player.id);
      const { accessToken } = await loginAsUser(app, player.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .post('/api/v1/invite/fixed-invite-token-for-test/join')
        .set(authHeader(accessToken));

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('ALREADY_MEMBER');
    });

    it('404 — invalid invite token', async () => {
      const user = await createTestUser(prisma, { username: 'invinvalid' });
      const { accessToken } = await loginAsUser(app, user.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .get('/api/v1/invite/nonexistent-token')
        .set(authHeader(accessToken));

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('INVALID_INVITE_TOKEN');
    });
  });

  describe('DELETE /campaigns/:id/members/:userId', () => {
    it('204 — DM removes member and unassigns characters', async () => {
      const dm = await createTestUser(prisma, { username: 'dmremove' });
      const player = await createTestUser(prisma, { username: 'playerremove' });
      const campaign = await createTestCampaign(prisma, dm.id);
      await addCampaignMember(prisma, campaign.id, player.id);

      const character = await prisma.character.create({
        data: {
          ownerId: player.id,
          campaignId: campaign.id,
          name: 'Removed Hero',
        },
      });

      const dmAuth = await loginAsUser(app, dm.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/campaigns/${campaign.id}/members/${player.id}`)
        .set(authHeader(dmAuth.accessToken));

      expect(res.status).toBe(204);

      const updatedCharacter = await prisma.character.findUnique({
        where: { id: character.id },
      });
      expect(updatedCharacter?.campaignId).toBeNull();
    });

    it('204 — player leaves campaign', async () => {
      const dm = await createTestUser(prisma, { username: 'dmleave' });
      const player = await createTestUser(prisma, { username: 'playerleave' });
      const campaign = await createTestCampaign(prisma, dm.id);
      await addCampaignMember(prisma, campaign.id, player.id);
      const { accessToken } = await loginAsUser(app, player.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/campaigns/${campaign.id}/members/${player.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(204);
    });
  });

  describe('GET /campaigns', () => {
    it('lists owned and member campaigns only', async () => {
      const dm = await createTestUser(prisma, { username: 'dmlist' });
      const player = await createTestUser(prisma, { username: 'playerlist' });
      const outsider = await createTestUser(prisma, { username: 'outsiderlist' });

      const owned = await createTestCampaign(prisma, dm.id, { name: 'DM Campaign' });
      const joined = await createTestCampaign(prisma, outsider.id, { name: 'Joined Campaign' });
      await addCampaignMember(prisma, joined.id, player.id);
      await createTestCampaign(prisma, outsider.id, { name: 'Hidden Campaign' });

      const { accessToken } = await loginAsUser(app, player.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .get('/api/v1/campaigns')
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({
        id: joined.id,
        role: 'PLAYER',
      });
      expect(res.body.data.find((c: { id: string }) => c.id === owned.id)).toBeUndefined();
    });
  });

  describe('DELETE /campaigns/:id', () => {
    it('204 — owner deletes campaign', async () => {
      const dm = await createTestUser(prisma, { username: 'dmdelete' });
      const campaign = await createTestCampaign(prisma, dm.id);
      const { accessToken } = await loginAsUser(app, dm.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/campaigns/${campaign.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(204);

      const deleted = await prisma.campaign.findUnique({ where: { id: campaign.id } });
      expect(deleted).toBeNull();
    });
  });
});
