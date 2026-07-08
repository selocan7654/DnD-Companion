import { Module } from '@nestjs/common';

import { AdminContentController } from './admin-content.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminService } from './admin.service';
import { AuditLogService } from './audit-log.service';

@Module({
  controllers: [AdminUsersController, AdminContentController],
  providers: [AdminService, AuditLogService],
  exports: [AuditLogService],
})
export class AdminModule {}
