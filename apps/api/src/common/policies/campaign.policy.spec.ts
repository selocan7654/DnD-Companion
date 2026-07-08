import { Role } from '@prisma/client';

import { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { CampaignPolicy } from './campaign.policy';

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    email: 'user@test.local',
    username: 'user1',
    role: Role.USER,
    isActive: true,
    emailVerifiedAt: new Date(),
    avatarUrl: null,
    ...overrides,
  };
}

const campaign = {
  ownerId: 'owner-1',
  members: [{ userId: 'member-1' }],
  owner: { isActive: true },
};

describe('CampaignPolicy', () => {
  describe('canRead', () => {
    it('allows ADMIN bypass', () => {
      const admin = makeUser({ id: 'admin-1', role: Role.ADMIN });
      expect(CampaignPolicy.canRead(admin, campaign)).toBe(true);
    });

    it('denies null user', () => {
      expect(CampaignPolicy.canRead(null, campaign)).toBe(false);
    });

    it('allows campaign owner', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(CampaignPolicy.canRead(owner, campaign)).toBe(true);
    });

    it('allows campaign member', () => {
      const member = makeUser({ id: 'member-1' });
      expect(CampaignPolicy.canRead(member, campaign)).toBe(true);
    });

    it('denies outsider', () => {
      const stranger = makeUser({ id: 'stranger-1' });
      expect(CampaignPolicy.canRead(stranger, campaign)).toBe(false);
    });

    it('denies member when owner is deactivated', () => {
      const deactivatedOwnerCampaign = {
        ...campaign,
        owner: { isActive: false },
      };
      const member = makeUser({ id: 'member-1' });
      expect(CampaignPolicy.canRead(member, deactivatedOwnerCampaign)).toBe(false);
      expect(CampaignPolicy.canRead(makeUser({ id: 'stranger-1' }), deactivatedOwnerCampaign)).toBe(
        false,
      );
    });

    it('allows ADMIN to read when owner is deactivated', () => {
      const deactivatedOwnerCampaign = {
        ...campaign,
        owner: { isActive: false },
      };
      const admin = makeUser({ id: 'admin-1', role: Role.ADMIN });
      expect(CampaignPolicy.canRead(admin, deactivatedOwnerCampaign)).toBe(true);
    });
  });

  describe('canUpdate', () => {
    it('allows ADMIN bypass', () => {
      const admin = makeUser({ id: 'admin-1', role: Role.ADMIN });
      expect(CampaignPolicy.canUpdate(admin, campaign)).toBe(true);
    });

    it('allows owner', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(CampaignPolicy.canUpdate(owner, campaign)).toBe(true);
    });

    it('denies member', () => {
      const member = makeUser({ id: 'member-1' });
      expect(CampaignPolicy.canUpdate(member, campaign)).toBe(false);
    });

    it('denies outsider', () => {
      const stranger = makeUser({ id: 'stranger-1' });
      expect(CampaignPolicy.canUpdate(stranger, campaign)).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('mirrors canUpdate for owner', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(CampaignPolicy.canDelete(owner, campaign)).toBe(true);
    });

    it('denies member', () => {
      const member = makeUser({ id: 'member-1' });
      expect(CampaignPolicy.canDelete(member, campaign)).toBe(false);
    });
  });

  describe('canManageInvite', () => {
    it('allows owner', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(CampaignPolicy.canManageInvite(owner, campaign)).toBe(true);
    });

    it('denies member', () => {
      const member = makeUser({ id: 'member-1' });
      expect(CampaignPolicy.canManageInvite(member, campaign)).toBe(false);
    });
  });

  describe('canRemoveMember', () => {
    it('allows ADMIN to remove any member', () => {
      const admin = makeUser({ id: 'admin-1', role: Role.ADMIN });
      expect(CampaignPolicy.canRemoveMember(admin, campaign, 'member-1')).toBe(true);
    });

    it('allows DM to remove a player', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(CampaignPolicy.canRemoveMember(owner, campaign, 'member-1')).toBe(true);
    });

    it('denies DM removing themselves', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(CampaignPolicy.canRemoveMember(owner, campaign, 'owner-1')).toBe(false);
    });

    it('allows member to leave (self)', () => {
      const member = makeUser({ id: 'member-1' });
      expect(CampaignPolicy.canRemoveMember(member, campaign, 'member-1')).toBe(true);
    });

    it('denies member removing another member', () => {
      const member = makeUser({ id: 'member-1' });
      expect(CampaignPolicy.canRemoveMember(member, campaign, 'member-2')).toBe(false);
    });

    it('denies outsider', () => {
      const stranger = makeUser({ id: 'stranger-1' });
      expect(CampaignPolicy.canRemoveMember(stranger, campaign, 'member-1')).toBe(false);
    });
  });
});
