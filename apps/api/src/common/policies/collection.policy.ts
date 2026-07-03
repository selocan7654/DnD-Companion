import { Role } from '@prisma/client';

import { AuthUser } from '../../auth/interfaces/auth-user.interface';

export class CollectionPolicy {
  static canRemove(user: AuthUser, collectionUserId: string): boolean {
    if (user.role === Role.ADMIN) return true;
    return user.id === collectionUserId;
  }
}
