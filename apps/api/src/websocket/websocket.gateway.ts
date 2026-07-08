import { Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Role } from '@prisma/client';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, type RedisClientType } from 'redis';
import { Server, Socket } from 'socket.io';

import { JwtPayload } from '../auth/interfaces/auth-user.interface';
import { PrismaService } from '../common/prisma/prisma.service';
import { EnvConfig } from '../config/env.validation';
import { LiveUpdatePayload, MemberJoinedPayload, MemberLeftPayload } from './live-update.types';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  private readonly logger = new Logger(WebsocketGateway.name);
  private pubClient: RedisClientType | null = null;
  private subClient: RedisClientType | null = null;

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {}

  async afterInit(server: Server): Promise<void> {
    // Single-instance tests avoid Redis adapter open handles; multi-instance needs it in app.
    if (this.configService.get('NODE_ENV', { infer: true }) === 'test') {
      this.logger.log('Socket.io Redis adapter skipped in test environment');
      return;
    }

    const redisUrl = this.configService.get('REDIS_URL', { infer: true });
    this.pubClient = createClient({ url: redisUrl }) as RedisClientType;
    this.subClient = this.pubClient.duplicate();
    await Promise.all([this.pubClient.connect(), this.subClient.connect()]);
    server.adapter(createAdapter(this.pubClient, this.subClient));
    this.logger.log('Socket.io Redis adapter connected');
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([
      this.pubClient?.quit().catch(() => undefined),
      this.subClient?.quit().catch(() => undefined),
    ]);
    this.pubClient = null;
    this.subClient = null;
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        throw new Error('No token');
      }

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get('JWT_ACCESS_SECRET', { infer: true }),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, username: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid user');
      }

      client.data.userId = user.id;
      client.data.username = user.username;
      client.data.role = user.role;
    } catch {
      client.disconnect(true);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleDisconnect(client: Socket): void {
    // Socket.io removes the client from all rooms automatically.
  }

  @SubscribeMessage('join-campaign')
  async handleJoinCampaign(client: Socket, payload: { campaignId: string }): Promise<void> {
    const userId = client.data.userId as string | undefined;
    if (!userId || !payload?.campaignId) {
      return;
    }

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: payload.campaignId },
      include: { members: { select: { userId: true } } },
    });

    if (!campaign) {
      client.emit('error', {
        event: 'join-campaign',
        message: 'Campaign not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    const isMember =
      campaign.ownerId === userId ||
      campaign.members.some((m) => m.userId === userId) ||
      client.data.role === Role.ADMIN;

    if (!isMember) {
      client.emit('error', {
        event: 'join-campaign',
        message: 'Not a member of this campaign',
        code: 'FORBIDDEN',
      });
      return;
    }

    await client.join(`campaign:${payload.campaignId}`);
    client.emit('joined-campaign', { campaignId: payload.campaignId });
  }

  @SubscribeMessage('leave-campaign')
  async handleLeaveCampaign(client: Socket, payload: { campaignId: string }): Promise<void> {
    if (!payload?.campaignId) {
      return;
    }
    await client.leave(`campaign:${payload.campaignId}`);
  }

  broadcastLiveUpdate(campaignId: string, data: LiveUpdatePayload): void {
    this.server.to(`campaign:${campaignId}`).emit('character:live-update', data);
  }

  broadcastMemberJoined(campaignId: string, data: MemberJoinedPayload): void {
    this.server.to(`campaign:${campaignId}`).emit('campaign:member-joined', data);
  }

  broadcastMemberLeft(campaignId: string, data: MemberLeftPayload): void {
    this.server.to(`campaign:${campaignId}`).emit('campaign:member-left', data);
  }
}
