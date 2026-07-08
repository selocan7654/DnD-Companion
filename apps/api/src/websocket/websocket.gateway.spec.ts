import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { Server, Socket } from 'socket.io';

import { PrismaService } from '../common/prisma/prisma.service';
import { EnvConfig } from '../config/env.validation';
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
