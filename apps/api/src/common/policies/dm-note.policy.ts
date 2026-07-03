import { Role } from '@prisma/client';

import { AuthUser } from '../../auth/interfaces/auth-user.interface';

export class DmNotePolicy {
  static canRead(user: AuthUser, campaign: { ownerId: string }): boolean {
    if (user.role === Role.ADMIN) return true;
    return campaign.ownerId === user.id;
  }

  static canWrite(user: AuthUser, campaign: { ownerId: string }): boolean {
    return DmNotePolicy.canRead(user, campaign);
  }
}
