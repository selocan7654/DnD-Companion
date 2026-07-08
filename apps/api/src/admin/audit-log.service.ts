import { Injectable } from '@nestjs/common';
import { AuditAction, AuditTargetType, Prisma } from '@prisma/client';

import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    actorId: string;
    action: AuditAction;
    targetType: AuditTargetType;
    targetId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        ...(params.metadata !== undefined
          ? { metadata: params.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });
  }
}
