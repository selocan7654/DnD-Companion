import { Test, TestingModule } from '@nestjs/testing';
import { AuditAction, AuditTargetType } from '@prisma/client';

import { PrismaService } from '../common/prisma/prisma.service';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let prisma: { auditLog: { create: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditLogService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(AuditLogService);
  });

  it('creates an audit log entry (INSERT only)', async () => {
    await service.log({
      actorId: 'admin-1',
      action: AuditAction.ROLE_CHANGED,
      targetType: AuditTargetType.USER,
      targetId: 'user-1',
      metadata: { oldRole: 'USER', newRole: 'ADMIN' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: 'admin-1',
        action: AuditAction.ROLE_CHANGED,
        targetType: AuditTargetType.USER,
        targetId: 'user-1',
        metadata: { oldRole: 'USER', newRole: 'ADMIN' },
      },
    });
  });

  it('exposes only a log method (no update/delete)', () => {
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(service)).filter(
      (name) => name !== 'constructor',
    );

    expect(methods).toEqual(['log']);
    expect(service).not.toHaveProperty('update');
    expect(service).not.toHaveProperty('delete');
    expect(service).not.toHaveProperty('remove');
  });
});
