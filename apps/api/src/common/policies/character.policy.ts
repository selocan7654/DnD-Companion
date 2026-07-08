import { CharacterVisibility, Role } from '@prisma/client';

import { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { CampaignWithMembers } from './campaign.policy';

export interface CharacterWithRelations {
  ownerId: string;
  campaignId: string | null;
  visibility: CharacterVisibility;
  owner?: { isActive: boolean };
  campaign?: (CampaignWithMembers & { id?: string }) | null;
}

export class CharacterPolicy {
  static canRead(user: AuthUser | null, character: CharacterWithRelations): boolean {
    if (user?.role === Role.ADMIN) return true;

    if (character.owner && !character.owner.isActive) {
      return false;
    }

    if (character.visibility === CharacterVisibility.PUBLIC) return true;
    if (!user) return false;
    if (character.ownerId === user.id) return true;

    if (character.campaignId && character.campaign) {
      if (character.campaign.ownerId === user.id) return true;
      return character.campaign.members.some((m) => m.userId === user.id);
    }

    return false;
  }

  static canUpdate(user: AuthUser, character: CharacterWithRelations): boolean {
    if (user.role === Role.ADMIN) return true;
    if (character.ownerId === user.id) return true;
    if (character.campaignId && character.campaign?.ownerId === user.id) return true;
    return false;
  }

  /** Owner or campaign DM may update live fields (HP, conditions, death saves). */
  static canUpdateLiveFields(user: AuthUser, character: CharacterWithRelations): boolean {
    if (user.role === Role.ADMIN) return true;
    if (character.ownerId === user.id) return true;
    if (character.campaignId && character.campaign?.ownerId === user.id) return true;
    return false;
  }

  static canDelete(user: AuthUser, character: CharacterWithRelations): boolean {
    return CharacterPolicy.canUpdate(user, character);
  }

  static canAssignCampaign(user: AuthUser, character: { ownerId: string }): boolean {
    if (user.role === Role.ADMIN) return true;
    return character.ownerId === user.id;
  }

  static canChangeVisibility(user: AuthUser, character: { ownerId: string }): boolean {
    if (user.role === Role.ADMIN) return true;
    return character.ownerId === user.id;
  }
}
