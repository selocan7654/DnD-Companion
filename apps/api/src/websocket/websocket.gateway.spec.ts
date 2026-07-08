import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import cookieParser from 'cookie-parser';
import { AddressInfo } from 'node:net';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { Server, Socket } from 'socket.io';
import request from 'supertest';

import { AppModule } from '../app.module';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';
import { PrismaService } from '../common/prisma/prisma.service';
import { EnvConfig } from '../config/env.validation';
import { authHeader, loginAsUser } from '../../test/auth-helper';
import { addCampaignMember, createTestCampaign } from '../../test/factories/campaign.factory';
import { createTestCharacter } from '../../test/factories/character.factory';
import { createTestUser, DEFAULT_TEST_PASSWORD } from '../../test/factories/user.factory';
import { prisma } from '../../test/setup';
import { WebsocketGateway } from './websocket.gateway';

describe('WebsocketGateway (unit)', () => {
  let gateway: WebsocketGateway;
  let prisma: { user: { findUnique: jest.Mock }; campaign: { findUnique: jest.Mock } };
  let jwtService: { verify: jest.Mock };
  let configService: { get: jest.Mock };

  const makeClient = (overrides: Partial<Socket> & { data?: Record<string, unknown> } = {}) => {
    const rooms = new Set<string>();
    return {
      handshake: { auth: {} as { token?: string } },
      data: {} as Record<string, unknown>,
      disconnect: jest.fn(),
      emit: jest.fn(),
      join: jest.fn(async (room: string) => {
        rooms.add(room);
      }),
      leave: jest.fn(async (room: string) => {
        rooms.delete(room);
      }),
      ...overrides,
    } as unknown as Socket & { rooms: Set<string> };
  };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      campaign: { findUnique: jest.fn() },
    };
    jwtService = { verify: jest.fn() };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return 'test-access-secret-at-least-32-chars!!';
        if (key === 'REDIS_URL') return 'redis://localhost:6379';
        return undefined;
      }),
    };

    gateway = new WebsocketGateway(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService<EnvConfig, true>,
    );

    const toEmit = jest.fn();
    gateway.server = {
      to: jest.fn(() => ({ emit: toEmit })),
    } as unknown as Server;
    (gateway as unknown as { _toEmit: jest.Mock })._toEmit = toEmit;
  });

  describe('handleConnection', () => {
    it('disconnects when token is missing', async () => {
      const client = makeClient();

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalledWith(true);
    });

    it('disconnects when token is invalid', async () => {
      const client = makeClient();
      client.handshake.auth = { token: 'bad-token' };
      jwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalledWith(true);
    });

    it('disconnects when user is inactive', async () => {
      const client = makeClient();
      client.handshake.auth = { token: 'valid-token' };
      jwtService.verify.mockReturnValue({ sub: 'user-1', role: Role.USER, emailVerified: true });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        username: 'player',
        role: Role.USER,
        isActive: false,
      });

      await gateway.handleConnection(client);

      expect(client.disconnect).toHaveBeenCalledWith(true);
    });

    it('attaches user data on valid token', async () => {
      const client = makeClient();
      client.handshake.auth = { token: 'valid-token' };
      jwtService.verify.mockReturnValue({ sub: 'user-1', role: Role.USER, emailVerified: true });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        username: 'player',
        role: Role.USER,
        isActive: true,
      });

      await gateway.handleConnection(client);

      expect(client.disconnect).not.toHaveBeenCalled();
      expect(client.data.userId).toBe('user-1');
      expect(client.data.username).toBe('player');
      expect(client.data.role).toBe(Role.USER);
    });
  });

  describe('handleJoinCampaign', () => {
    it('emits FORBIDDEN for outsider', async () => {
      const client = makeClient();
      client.data.userId = 'stranger-1';
      client.data.role = Role.USER;
      prisma.campaign.findUnique.mockResolvedValue({
        id: 'campaign-1',
        ownerId: 'dm-1',
        members: [{ userId: 'member-1' }],
      });

      await gateway.handleJoinCampaign(client, { campaignId: 'campaign-1' });

      expect(client.emit).toHaveBeenCalledWith('error', {
        event: 'join-campaign',
        message: 'Not a member of this campaign',
        code: 'FORBIDDEN',
      });
      expect(client.join).not.toHaveBeenCalled();
    });

    it('joins room for campaign owner', async () => {
      const client = makeClient();
      client.data.userId = 'dm-1';
      client.data.role = Role.USER;
      prisma.campaign.findUnique.mockResolvedValue({
        id: 'campaign-1',
        ownerId: 'dm-1',
        members: [],
      });

      await gateway.handleJoinCampaign(client, { campaignId: 'campaign-1' });

      expect(client.join).toHaveBeenCalledWith('campaign:campaign-1');
      expect(client.emit).toHaveBeenCalledWith('joined-campaign', { campaignId: 'campaign-1' });
    });

    it('emits NOT_FOUND when campaign is missing', async () => {
      const client = makeClient();
      client.data.userId = 'user-1';
      prisma.campaign.findUnique.mockResolvedValue(null);

      await gateway.handleJoinCampaign(client, { campaignId: 'missing' });

      expect(client.emit).toHaveBeenCalledWith('error', {
        event: 'join-campaign',
        message: 'Campaign not found',
        code: 'NOT_FOUND',
      });
    });
  });

  describe('broadcastLiveUpdate', () => {
    it('emits character:live-update to campaign room', () => {
      const payload = {
        characterId: 'char-1',
        characterName: 'Thorin',
        fields: { hitPointsCurrent: 25 },
        updatedBy: 'player42',
      };

      gateway.broadcastLiveUpdate('campaign-1', payload);

      expect(gateway.server.to).toHaveBeenCalledWith('campaign:campaign-1');
      expect((gateway as unknown as { _toEmit: jest.Mock })._toEmit).toHaveBeenCalledWith(
        'character:live-update',
        payload,
      );
    });
  });

  describe('handleLeaveCampaign', () => {
    it('leaves campaign room', async () => {
      const client = makeClient();

      await gateway.handleLeaveCampaign(client, { campaignId: 'campaign-1' });

      expect(client.leave).toHaveBeenCalledWith('campaign:campaign-1');
    });
  });
});

function onceEvent<T>(socket: ClientSocket, event: string, timeoutMs = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for "${event}"`));
    }, timeoutMs);

    socket.once(event, (payload: T) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

function waitForConnect(socket: ClientSocket, timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (socket.connected) {
      resolve();
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error('Timeout waiting for connect'));
    }, timeoutMs);

    socket.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    socket.once('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/** Socket.io fires `connect` before Nest finishes async handleConnection JWT verify. */
async function waitForAuthenticatedConnect(socket: ClientSocket): Promise<void> {
  await waitForConnect(socket);
  await new Promise((resolve) => setTimeout(resolve, 150));
}

/** Waits until handshake settles as disconnected (covers connect-then-kick). */
function ensureDisconnected(socket: ClientSocket, timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setTimeout(() => {
      clearInterval(interval);
      reject(new Error('Timeout waiting for disconnect'));
    }, timeoutMs);

    const done = () => {
      clearTimeout(timer);
      clearInterval(interval);
      resolve();
    };

    socket.once('disconnect', done);
    socket.once('connect_error', done);

    const interval = setInterval(() => {
      // Avoid resolving on the initial pre-handshake disconnected state.
      if (!socket.connected && Date.now() - started > 150) {
        done();
      }
    }, 25);
  });
}

describe('WebsocketGateway (integration)', () => {
  let app: INestApplication;
  let baseUrl: string;
  const openSockets: ClientSocket[] = [];

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
    await app.listen(0);

    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(() => {
    while (openSockets.length > 0) {
      const socket = openSockets.pop();
      socket?.removeAllListeners();
      socket?.disconnect();
    }
  });

  afterAll(async () => {
    await app.close();
  });

  function connectClient(auth?: { token?: string }): ClientSocket {
    const socket = io(baseUrl, {
      auth: auth ?? {},
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });
    openSockets.push(socket);
    return socket;
  }

  describe('JWT handshake', () => {
    it('accepts connection with valid JWT', async () => {
      const user = await createTestUser(prisma, { username: 'wsvalid' });
      const { accessToken } = await loginAsUser(app, user.email, DEFAULT_TEST_PASSWORD);

      const socket = connectClient({ token: accessToken });
      await waitForAuthenticatedConnect(socket);

      expect(socket.connected).toBe(true);
    });

    it('disconnects when token is missing', async () => {
      const socket = connectClient();
      await ensureDisconnected(socket);

      expect(socket.connected).toBe(false);
    });

    it('disconnects when token is invalid', async () => {
      const socket = connectClient({ token: 'not-a-valid-jwt' });
      await ensureDisconnected(socket);

      expect(socket.connected).toBe(false);
    });

    it('disconnects when user is deactivated', async () => {
      const user = await createTestUser(prisma, { username: 'wsdeact' });
      const { accessToken } = await loginAsUser(app, user.email, DEFAULT_TEST_PASSWORD);
      await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });

      const socket = connectClient({ token: accessToken });
      await ensureDisconnected(socket);

      expect(socket.connected).toBe(false);
    });
  });

  describe('join-campaign', () => {
    it('joins room for campaign DM and emits joined-campaign', async () => {
      const dm = await createTestUser(prisma, { username: 'wsdmjoin' });
      const campaign = await createTestCampaign(prisma, dm.id);
      const { accessToken } = await loginAsUser(app, dm.email, DEFAULT_TEST_PASSWORD);

      const socket = connectClient({ token: accessToken });
      await waitForAuthenticatedConnect(socket);

      const joinedPromise = onceEvent<{ campaignId: string }>(socket, 'joined-campaign');
      socket.emit('join-campaign', { campaignId: campaign.id });
      const joined = await joinedPromise;

      expect(joined.campaignId).toBe(campaign.id);
    });

    it('joins room for campaign member', async () => {
      const dm = await createTestUser(prisma, { username: 'wsdmmember' });
      const member = await createTestUser(prisma, { username: 'wsmember' });
      const campaign = await createTestCampaign(prisma, dm.id);
      await addCampaignMember(prisma, campaign.id, member.id);
      const { accessToken } = await loginAsUser(app, member.email, DEFAULT_TEST_PASSWORD);

      const socket = connectClient({ token: accessToken });
      await waitForAuthenticatedConnect(socket);

      const joinedPromise = onceEvent<{ campaignId: string }>(socket, 'joined-campaign');
      socket.emit('join-campaign', { campaignId: campaign.id });
      const joined = await joinedPromise;

      expect(joined.campaignId).toBe(campaign.id);
    });

    it('emits FORBIDDEN for outsider join-campaign', async () => {
      const dm = await createTestUser(prisma, { username: 'wsdmforbid' });
      const stranger = await createTestUser(prisma, { username: 'wsstranger' });
      const campaign = await createTestCampaign(prisma, dm.id);
      const { accessToken } = await loginAsUser(app, stranger.email, DEFAULT_TEST_PASSWORD);

      const socket = connectClient({ token: accessToken });
      await waitForAuthenticatedConnect(socket);

      const errorPromise = onceEvent<{ event: string; code: string; message: string }>(
        socket,
        'error',
      );
      socket.emit('join-campaign', { campaignId: campaign.id });
      const error = await errorPromise;

      expect(error).toEqual({
        event: 'join-campaign',
        message: 'Not a member of this campaign',
        code: 'FORBIDDEN',
      });
    });
  });

  describe('character:live-update broadcast', () => {
    it('delivers character:live-update to room after PATCH /characters/:id/live', async () => {
      const dm = await createTestUser(prisma, { username: 'wsdmlive' });
      const player = await createTestUser(prisma, { username: 'wsplayerlive' });
      const campaign = await createTestCampaign(prisma, dm.id);
      await addCampaignMember(prisma, campaign.id, player.id);
      const character = await createTestCharacter(prisma, player.id, {
        campaignId: campaign.id,
        name: 'Live Thorin',
      });

      const { accessToken: dmToken } = await loginAsUser(app, dm.email, DEFAULT_TEST_PASSWORD);
      const { accessToken: playerToken } = await loginAsUser(
        app,
        player.email,
        DEFAULT_TEST_PASSWORD,
      );

      const listener = connectClient({ token: dmToken });
      await waitForAuthenticatedConnect(listener);
      const joinedPromise = onceEvent<{ campaignId: string }>(listener, 'joined-campaign');
      listener.emit('join-campaign', { campaignId: campaign.id });
      await joinedPromise;

      const updatePromise = onceEvent<{
        characterId: string;
        characterName: string;
        fields: { hitPointsCurrent?: number };
        updatedBy: string;
      }>(listener, 'character:live-update');

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/characters/${character.id}/live`)
        .set(authHeader(playerToken))
        .send({ hitPointsCurrent: 22 });

      expect(res.status).toBe(200);

      const payload = await updatePromise;
      expect(payload).toMatchObject({
        characterId: character.id,
        characterName: 'Live Thorin',
        fields: { hitPointsCurrent: 22 },
        updatedBy: player.username,
      });
    });
  });
});
