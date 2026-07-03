import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CharacterVisibility } from '@prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../app.module';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { authHeader, loginAsUser } from '../../test/auth-helper';
import { addCampaignMember, createTestCampaign } from '../../test/factories/campaign.factory';
import { createTestCharacter } from '../../test/factories/character.factory';
import { createTestUser, DEFAULT_TEST_PASSWORD } from '../../test/factories/user.factory';
import { prisma } from '../../test/setup';

describe('CharactersController (integration)', () => {
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

  describe('POST /characters', () => {
    it('201 — verified user creates character', async () => {
      const owner = await createTestUser(prisma, { username: 'charowner' });
      const { accessToken } = await loginAsUser(app, owner.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .post('/api/v1/characters')
        .set(authHeader(accessToken))
        .send({
          name: 'Thorin Ironforge',
          race: 'Dwarf',
          className: 'Fighter',
          level: 5,
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        name: 'Thorin Ironforge',
        race: 'Dwarf',
        className: 'Fighter',
        level: 5,
        ownerId: owner.id,
        ownerUsername: owner.username,
        visibility: CharacterVisibility.PRIVATE,
      });
      expect(res.body.data).not.toHaveProperty('email');
    });

    it('403 — unverified user cannot create character', async () => {
      const unverified = await createTestUser(prisma, {
        username: 'unverifiedchar',
        emailVerifiedAt: null,
      });
      const { accessToken } = await loginAsUser(app, unverified.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .post('/api/v1/characters')
        .set(authHeader(accessToken))
        .send({ name: 'Blocked Character' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('EMAIL_NOT_VERIFIED');
    });
  });

  describe('GET /characters', () => {
    it('200 — lists only own characters', async () => {
      const owner = await createTestUser(prisma, { username: 'listowner' });
      const other = await createTestUser(prisma, { username: 'listother' });
      await createTestCharacter(prisma, owner.id, { name: 'Mine' });
      await createTestCharacter(prisma, other.id, { name: 'Not Mine' });

      const { accessToken } = await loginAsUser(app, owner.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .get('/api/v1/characters')
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Mine');
    });
  });

  describe('GET /characters/:id', () => {
    it('200 — guest reads PUBLIC character', async () => {
      const owner = await createTestUser(prisma, { username: 'publicowner' });
      const character = await createTestCharacter(prisma, owner.id, {
        name: 'Public Hero',
        visibility: CharacterVisibility.PUBLIC,
      });

      const res = await request(app.getHttpServer()).get(`/api/v1/characters/${character.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Public Hero');
      expect(res.body.data.ownerUsername).toBe(owner.username);
      expect(res.body.data).not.toHaveProperty('email');
    });

    it('404 — outsider cannot read PRIVATE character', async () => {
      const owner = await createTestUser(prisma, { username: 'privateowner' });
      const stranger = await createTestUser(prisma, { username: 'privatestranger' });
      const character = await createTestCharacter(prisma, owner.id, {
        visibility: CharacterVisibility.PRIVATE,
      });
      const { accessToken } = await loginAsUser(app, stranger.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/characters/${character.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(404);
    });

    it('200 — campaign member reads assigned PRIVATE character', async () => {
      const dm = await createTestUser(prisma, { username: 'dmcharread' });
      const player = await createTestUser(prisma, { username: 'playercharread' });
      const campaign = await createTestCampaign(prisma, dm.id);
      await addCampaignMember(prisma, campaign.id, player.id);
      const character = await createTestCharacter(prisma, player.id, {
        campaignId: campaign.id,
        visibility: CharacterVisibility.PRIVATE,
      });

      const { accessToken } = await loginAsUser(app, dm.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/characters/${character.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(character.id);
    });
  });

  describe('PATCH /characters/:id', () => {
    it('200 — owner updates character', async () => {
      const owner = await createTestUser(prisma, { username: 'charpatchowner' });
      const character = await createTestCharacter(prisma, owner.id);
      const { accessToken } = await loginAsUser(app, owner.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/characters/${character.id}`)
        .set(authHeader(accessToken))
        .send({ level: 6, hitPointsMax: 52 });

      expect(res.status).toBe(200);
      expect(res.body.data.level).toBe(6);
      expect(res.body.data.hitPointsMax).toBe(52);
    });

    it('200 — campaign DM updates assigned character', async () => {
      const dm = await createTestUser(prisma, { username: 'dmpatchchar' });
      const player = await createTestUser(prisma, { username: 'playerpatchchar' });
      const campaign = await createTestCampaign(prisma, dm.id);
      await addCampaignMember(prisma, campaign.id, player.id);
      const character = await createTestCharacter(prisma, player.id, { campaignId: campaign.id });
      const { accessToken } = await loginAsUser(app, dm.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/characters/${character.id}`)
        .set(authHeader(accessToken))
        .send({ hitPointsCurrent: 20 });

      expect(res.status).toBe(200);
      expect(res.body.data.hitPointsCurrent).toBe(20);
    });

    it('403 — campaign member cannot update assigned character', async () => {
      const dm = await createTestUser(prisma, { username: 'dmdenypatch' });
      const player = await createTestUser(prisma, { username: 'playerdenypatch' });
      const otherMember = await createTestUser(prisma, { username: 'othermemberpatch' });
      const campaign = await createTestCampaign(prisma, dm.id);
      await addCampaignMember(prisma, campaign.id, player.id);
      await addCampaignMember(prisma, campaign.id, otherMember.id);
      const character = await createTestCharacter(prisma, player.id, { campaignId: campaign.id });
      const { accessToken } = await loginAsUser(app, otherMember.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/characters/${character.id}`)
        .set(authHeader(accessToken))
        .send({ hitPointsCurrent: 1 });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /characters/:id/campaign', () => {
    it('200 — owner assigns character to campaign', async () => {
      const dm = await createTestUser(prisma, { username: 'dmassign' });
      const player = await createTestUser(prisma, { username: 'playerassign' });
      const campaign = await createTestCampaign(prisma, dm.id);
      await addCampaignMember(prisma, campaign.id, player.id);
      const character = await createTestCharacter(prisma, player.id);
      const { accessToken } = await loginAsUser(app, player.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/characters/${character.id}/campaign`)
        .set(authHeader(accessToken))
        .send({ campaignId: campaign.id });

      expect(res.status).toBe(200);
      expect(res.body.data.campaignId).toBe(campaign.id);
    });

    it('200 — owner unassigns character from campaign', async () => {
      const dm = await createTestUser(prisma, { username: 'dmunassign' });
      const player = await createTestUser(prisma, { username: 'playerunassign' });
      const campaign = await createTestCampaign(prisma, dm.id);
      await addCampaignMember(prisma, campaign.id, player.id);
      const character = await createTestCharacter(prisma, player.id, { campaignId: campaign.id });
      const { accessToken } = await loginAsUser(app, player.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/characters/${character.id}/campaign`)
        .set(authHeader(accessToken))
        .send({ campaignId: null });

      expect(res.status).toBe(200);
      expect(res.body.data.campaignId).toBeNull();
    });

    it('409 — cannot reassign without unassigning first', async () => {
      const dm1 = await createTestUser(prisma, { username: 'dm1reassign' });
      const dm2 = await createTestUser(prisma, { username: 'dm2reassign' });
      const player = await createTestUser(prisma, { username: 'playerreassign' });
      const campaign1 = await createTestCampaign(prisma, dm1.id);
      const campaign2 = await createTestCampaign(prisma, dm2.id);
      await addCampaignMember(prisma, campaign1.id, player.id);
      await addCampaignMember(prisma, campaign2.id, player.id);
      const character = await createTestCharacter(prisma, player.id, { campaignId: campaign1.id });
      const { accessToken } = await loginAsUser(app, player.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/characters/${character.id}/campaign`)
        .set(authHeader(accessToken))
        .send({ campaignId: campaign2.id });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('ALREADY_ASSIGNED_TO_CAMPAIGN');
    });

    it('403 — non-member cannot assign to campaign', async () => {
      const dm = await createTestUser(prisma, { username: 'dmassign403' });
      const owner = await createTestUser(prisma, { username: 'ownerassign403' });
      const campaign = await createTestCampaign(prisma, dm.id);
      const character = await createTestCharacter(prisma, owner.id);
      const { accessToken } = await loginAsUser(app, owner.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/characters/${character.id}/campaign`)
        .set(authHeader(accessToken))
        .send({ campaignId: campaign.id });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /characters/:id/visibility', () => {
    it('200 — owner sets visibility to PUBLIC', async () => {
      const owner = await createTestUser(prisma, { username: 'visowner' });
      const character = await createTestCharacter(prisma, owner.id);
      const { accessToken } = await loginAsUser(app, owner.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/characters/${character.id}/visibility`)
        .set(authHeader(accessToken))
        .send({ visibility: CharacterVisibility.PUBLIC });

      expect(res.status).toBe(200);
      expect(res.body.data.visibility).toBe(CharacterVisibility.PUBLIC);
    });

    it('403 — non-owner cannot change visibility', async () => {
      const dm = await createTestUser(prisma, { username: 'dmvis403' });
      const player = await createTestUser(prisma, { username: 'playervis403' });
      const campaign = await createTestCampaign(prisma, dm.id);
      await addCampaignMember(prisma, campaign.id, player.id);
      const character = await createTestCharacter(prisma, player.id, { campaignId: campaign.id });
      const { accessToken } = await loginAsUser(app, dm.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/characters/${character.id}/visibility`)
        .set(authHeader(accessToken))
        .send({ visibility: CharacterVisibility.PUBLIC });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /characters/:id', () => {
    it('204 — owner deletes character', async () => {
      const owner = await createTestUser(prisma, { username: 'chardelete' });
      const character = await createTestCharacter(prisma, owner.id);
      const { accessToken } = await loginAsUser(app, owner.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/characters/${character.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(204);

      const deleted = await prisma.character.findUnique({ where: { id: character.id } });
      expect(deleted).toBeNull();
    });

    it('204 — campaign DM deletes assigned character', async () => {
      const dm = await createTestUser(prisma, { username: 'dmdeletechar' });
      const player = await createTestUser(prisma, { username: 'playerdeletechar' });
      const campaign = await createTestCampaign(prisma, dm.id);
      await addCampaignMember(prisma, campaign.id, player.id);
      const character = await createTestCharacter(prisma, player.id, { campaignId: campaign.id });
      const { accessToken } = await loginAsUser(app, dm.email, DEFAULT_TEST_PASSWORD);

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/characters/${character.id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(204);
    });
  });
});
