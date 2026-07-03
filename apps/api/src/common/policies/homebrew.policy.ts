import { HomebrewStatus, Role, Source } from '@prisma/client';

import { AuthUser } from '../../auth/interfaces/auth-user.interface';

export interface HomebrewItemContext {
  ownerId: string | null;
  source: Source;
  status: HomebrewStatus;
}

export class HomebrewPolicy {
  static canRead(user: AuthUser | null, item: HomebrewItemContext): boolean {
    if (user?.role === Role.ADMIN) return true;
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
