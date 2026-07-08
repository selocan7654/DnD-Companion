import { Role } from '@prisma/client';

import { AuthUser } from '../../auth/interfaces/auth-user.interface';

export interface CampaignWithMembers {
  ownerId: string;
  members: Array<{ userId: string }>;
  owner?: { isActive: boolean };
}

export class CampaignPolicy {
  static canRead(user: AuthUser | null, campaign: CampaignWithMembers): boolean {
    if (user?.role === Role.ADMIN) return true;

    // Deactivated owner content is hidden from non-admins ([AP-002]).
    if (campaign.owner && !campaign.owner.isActive) {
      return false;
    }

    if (!user) return false;
    if (campaign.ownerId === user.id) return true;
    return campaign.members.some((m) => m.userId === user.id);
  }

  static canUpdate(user: AuthUser, campaign: { ownerId: string }): boolean {
    if (user.role === Role.ADMIN) return true;
    return campaign.ownerId === user.id;
  }

  static canDelete(user: AuthUser, campaign: { ownerId: string }): boolean {
    return CampaignPolicy.canUpdate(user, campaign);
  }

  static canManageInvite(user: AuthUser, campaign: { ownerId: string }): boolean {
    return CampaignPolicy.canUpdate(user, campaign);
  }

  static canRemoveMember(
    user: AuthUser,
    campaign: { ownerId: string },
    targetUserId: string,
  ): boolean {
    if (user.role === Role.ADMIN) return true;
    if (campaign.ownerId === user.id && targetUserId !== user.id) return true;
    if (targetUserId === user.id && campaign.ownerId !== user.id) return true;
    return false;
  }
}
