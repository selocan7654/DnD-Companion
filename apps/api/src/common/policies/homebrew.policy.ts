import { HomebrewStatus, Role, Source } from '@prisma/client';

import { AuthUser } from '../../auth/interfaces/auth-user.interface';

export interface HomebrewItemContext {
  ownerId: string | null;
  source: Source;
  status: HomebrewStatus;
  owner?: { isActive: boolean } | null;
}

export class HomebrewPolicy {
  static canRead(user: AuthUser | null, item: HomebrewItemContext): boolean {
    if (user?.role === Role.ADMIN) return true;

    // Deactivated owner content is hidden from non-admins ([AP-002]).
    if (item.owner && !item.owner.isActive) {
      return false;
    }

    if (item.status === HomebrewStatus.PUBLISHED) return true;
    if (!user) return false;
    return item.ownerId === user.id;
  }

  static canUpdate(user: AuthUser, item: HomebrewItemContext): boolean {
    if (user.role === Role.ADMIN) return true;
    if (item.source !== Source.HOMEBREW) return false;
    return item.ownerId === user.id;
  }

  static canDelete(user: AuthUser, item: HomebrewItemContext): boolean {
    return HomebrewPolicy.canUpdate(user, item);
  }

  static canPublish(user: AuthUser, item: HomebrewItemContext): boolean {
    return HomebrewPolicy.canUpdate(user, item);
  }

  static canUnpublish(user: AuthUser, item: HomebrewItemContext): boolean {
    return HomebrewPolicy.canUpdate(user, item);
  }
}
