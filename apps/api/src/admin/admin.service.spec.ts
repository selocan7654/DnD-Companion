import { ConflictException, NotFoundException } from '@nestjs/common';
import { AuditAction, Role } from '@prisma/client';

import { LastAdminException } from '../common/exceptions/last-admin.exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
    refreshToken: { updateMany: jest.Mock };
    auditLog: { create: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: { updateMany: jest.fn() },
      auditLog: { create: jest.fn() },
      $transaction: jest.fn(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma)),
    };

    service = new AdminService(prisma as unknown as PrismaService);
  });

  describe('changeRole', () => {
    it('throws LAST_ADMIN when demoting the sole active admin', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        role: Role.ADMIN,
        isActive: true,
        email: 'admin@test.local',
        username: 'admin',
        avatarUrl: null,
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.user.count.mockResolvedValue(1);

      await expect(
        service.changeRole('actor-1', 'admin-1', { role: Role.USER }),
      ).rejects.toBeInstanceOf(LastAdminException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('allows demoting admin when another active admin remains', async () => {
      const target = {
        id: 'admin-1',
        role: Role.ADMIN,
        isActive: true,
        email: 'admin@test.local',
        username: 'admin',
        avatarUrl: null,
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.user.findUnique.mockResolvedValue(target);
      prisma.user.count.mockResolvedValue(2);
      prisma.user.update.mockResolvedValue({ ...target, role: Role.USER });
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.changeRole('actor-1', 'admin-1', { role: Role.USER });

      expect(result.data.role).toBe(Role.USER);
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: AuditAction.ROLE_CHANGED,
            metadata: { oldRole: Role.ADMIN, newRole: Role.USER },
          }),
        }),
      );
    });

    it('throws NotFoundException when target user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changeRole('actor-1', 'missing', { role: Role.ADMIN }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deactivateUser', () => {
    it('throws LAST_ADMIN when deactivating the sole active admin', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        role: Role.ADMIN,
        isActive: true,
        email: 'admin@test.local',
        username: 'admin',
      });
      prisma.user.count.mockResolvedValue(1);

      await expect(service.deactivateUser('actor-1', 'admin-1')).rejects.toBeInstanceOf(
        LastAdminException,
      );
    });

    it('throws ConflictException when user is already deactivated', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: Role.USER,
        isActive: false,
        email: 'user@test.local',
        username: 'user',
      });

      await expect(service.deactivateUser('actor-1', 'user-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('deactivates user, revokes refresh tokens, and writes USER_DEACTIVATED audit', async () => {
      const target = {
        id: 'user-1',
        role: Role.USER,
        isActive: true,
        email: 'user@test.local',
        username: 'player',
        avatarUrl: null,
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.user.findUnique.mockResolvedValue(target);
      prisma.user.update.mockResolvedValue({ ...target, isActive: false });
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.deactivateUser('actor-1', 'user-1');

      expect(result.data.isActive).toBe(false);
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', isRevoked: false },
          data: { isRevoked: true },
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: AuditAction.USER_DEACTIVATED,
            targetId: 'user-1',
            metadata: {
              targetEmail: target.email,
              targetUsername: target.username,
            },
          }),
        }),
      );
    });

    it('allows deactivating an admin when another active admin remains', async () => {
      const target = {
        id: 'admin-2',
        role: Role.ADMIN,
        isActive: true,
        email: 'admin2@test.local',
        username: 'admin2',
        avatarUrl: null,
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.user.findUnique.mockResolvedValue(target);
      prisma.user.count.mockResolvedValue(2);
      prisma.user.update.mockResolvedValue({ ...target, isActive: false });
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.deactivateUser('actor-1', 'admin-2');

      expect(result.data.isActive).toBe(false);
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { role: Role.ADMIN, isActive: true },
      });
    });
  });
});
