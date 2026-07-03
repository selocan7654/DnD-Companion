import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HomebrewStatus, HomebrewType, Role, Source } from '@prisma/client';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { randomUUID } from 'node:crypto';

import { AppModule } from '../app.module';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { authHeader, loginAsUser } from '../../test/auth-helper';
import {
  createOfficialHomebrew,
  createTestHomebrew,
  DEFAULT_FEAT_DATA,
} from '../../test/factories/homebrew.factory';
import { createTestUser, DEFAULT_TEST_PASSWORD } from '../../test/factories/user.factory';
import { prisma } from '../../test/setup';

describe('Reference endpoints (integration)', () => {
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
      username: 'refadmin',
      role: Role.ADMIN,
      emailVerifiedAt: new Date(),
    });
    const { accessToken } = await loginAsUser(app, admin.email, DEFAULT_TEST_PASSWORD);
    return { accessToken };
  }

  describe('GET /reference/spells', () => {
    it('200 — guest lists official spells', async () => {
      await createOfficialHomebrew(prisma, {
        name: 'Guest Spell',
        type: HomebrewType.SPELL,
        source: Source.PHB,
        data: {
          level: 3,
          school: 'Evocation',
          casting_time: '1 action',
          range: '150 feet',
          components: { V: true, S: true, M: 'a bit of bat fur' },
          duration: 'Instantaneous',
          concentration: false,
          ritual: false,
          classes: ['Wizard'],
          description: 'A bright streak flashes from your pointing finger.',
        },
      });

      const res = await request(app.getHttpServer()).get('/api/v1/reference/spells');

      expect(res.status).toBe(200);
      expect(res.body.data.some((item: { name: string }) => item.name === 'Guest Spell')).toBe(
        true,
      );
      expect(res.body).toHaveProperty('hasMore');
    });

    it('200 — verified user lists official spells', async () => {
      const { accessToken } = await loginVerifiedUser('refspelluser');
      const res = await request(app.getHttpServer())
        .get('/api/v1/reference/spells')
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
    });

    it('200 — ADMIN lists official spells', async () => {
      const { accessToken } = await loginAdmin();
      const res = await request(app.getHttpServer())
        .get('/api/v1/reference/spells')
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
    });

    it('excludes homebrew source items from reference list', async () => {
      const owner = await createTestUser(prisma, { username: 'refhbowner' });
      await createTestHomebrew(prisma, owner.id, {
        name: 'User Homebrew Spell',
        type: HomebrewType.SPELL,
        status: HomebrewStatus.PUBLISHED,
        data: {
          level: 1,
          school: 'Evocation',
          casting_time: '1 action',
          range: 'Self',
          components: { V: true, S: true },
          duration: 'Instantaneous',
          concentration: false,
          ritual: false,
          classes: ['Sorcerer'],
          description: 'Homebrew only',
        },
      });

      const res = await request(app.getHttpServer()).get('/api/v1/reference/spells');

      expect(res.status).toBe(200);
      expect(
        res.body.data.some((item: { name: string }) => item.name === 'User Homebrew Spell'),
      ).toBe(false);
    });
  });

  describe('GET /reference/spells/:id', () => {
    it('200 — guest reads official spell detail', async () => {
      const spell = await createOfficialHomebrew(prisma, {
        name: 'Detail Spell',
        type: HomebrewType.SPELL,
        source: Source.PHB,
        data: {
          level: 0,
          school: 'Evocation',
          casting_time: '1 action',
          range: '120 feet',
          components: { V: true, S: true },
          duration: 'Instantaneous',
          concentration: false,
          ritual: false,
          classes: ['Wizard'],
          description: 'A beam of light',
        },
      });

      const res = await request(app.getHttpServer()).get(`/api/v1/reference/spells/${spell.id}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Detail Spell');
      expect(res.body.data).toHaveProperty('data');
    });

    it('404 — invalid spell id', async () => {
      const res = await request(app.getHttpServer()).get(
        `/api/v1/reference/spells/${randomUUID()}`,
      );

      expect(res.status).toBe(404);
    });

    it('404 — homebrew spell id is not exposed via reference detail', async () => {
      const owner = await createTestUser(prisma, { username: 'refhbdetailowner' });
      const homebrewSpell = await createTestHomebrew(prisma, owner.id, {
        name: 'Hidden Homebrew Spell',
        type: HomebrewType.SPELL,
        status: HomebrewStatus.PUBLISHED,
        data: {
          level: 1,
          school: 'Evocation',
          casting_time: '1 action',
          range: 'Self',
          components: { V: true, S: true },
          duration: 'Instantaneous',
          concentration: false,
          ritual: false,
          classes: ['Wizard'],
          description: 'Not reference',
        },
      });

      const res = await request(app.getHttpServer()).get(
        `/api/v1/reference/spells/${homebrewSpell.id}`,
      );

      expect(res.status).toBe(404);
    });
  });

  describe('GET /reference/monsters and other types', () => {
    it('200 — guest lists monsters', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/reference/monsters');
      expect(res.status).toBe(200);
    });

    it('200 — guest lists feats', async () => {
      await createOfficialHomebrew(prisma, {
        name: 'Official Feat',
        type: HomebrewType.FEAT,
        source: Source.PHB,
        data: DEFAULT_FEAT_DATA,
      });

      const res = await request(app.getHttpServer()).get('/api/v1/reference/feats');
      expect(res.status).toBe(200);
      expect(res.body.data.some((item: { name: string }) => item.name === 'Official Feat')).toBe(
        true,
      );
    });

    it('200 — guest lists backgrounds', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/reference/backgrounds');
      expect(res.status).toBe(200);
    });

    it('200 — guest lists magic-items', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/reference/magic-items');
      expect(res.status).toBe(200);
    });

    it('200 — guest lists subclasses', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/reference/subclasses');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /reference/classes and /reference/races', () => {
    it('200 — guest reads classes', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/reference/classes');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(13);
      expect(res.body.data.some((item: { name: string }) => item.name === 'Wizard')).toBe(true);
    });

    it('200 — verified user reads classes', async () => {
      const { accessToken } = await loginVerifiedUser('refclassuser');
      const res = await request(app.getHttpServer())
        .get('/api/v1/reference/classes')
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
    });

    it('200 — guest reads races', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/reference/races');

      expect(res.status).toBe(200);
      expect(res.body.data.some((item: { name: string }) => item.name === 'Elf')).toBe(true);
    });

    it('200 — verified user reads races', async () => {
      const { accessToken } = await loginVerifiedUser('refraceuser');
      const res = await request(app.getHttpServer())
        .get('/api/v1/reference/races')
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
    });
  });
});
