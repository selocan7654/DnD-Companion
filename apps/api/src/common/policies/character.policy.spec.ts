import { CharacterVisibility, Role } from '@prisma/client';

import { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { CharacterPolicy } from './character.policy';

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

const activeOwner = { isActive: true };
const inactiveOwner = { isActive: false };

const campaign = {
  ownerId: 'dm-1',
  members: [{ userId: 'member-1' }],
};

const privateCharacter = {
  ownerId: 'owner-1',
  campaignId: null as string | null,
  visibility: CharacterVisibility.PRIVATE,
  owner: activeOwner,
  campaign: null,
};

const publicCharacter = {
  ...privateCharacter,
  visibility: CharacterVisibility.PUBLIC,
};

const assignedCharacter = {
  ownerId: 'owner-1',
  campaignId: 'campaign-1',
  visibility: CharacterVisibility.PRIVATE,
  owner: activeOwner,
  campaign,
};

describe('CharacterPolicy', () => {
  describe('canRead', () => {
    it('allows ADMIN bypass', () => {
      const admin = makeUser({ id: 'admin-1', role: Role.ADMIN });
      expect(CharacterPolicy.canRead(admin, privateCharacter)).toBe(true);
    });

    it('allows PUBLIC read for guest', () => {
      expect(CharacterPolicy.canRead(null, publicCharacter)).toBe(true);
    });

    it('denies PRIVATE read for guest', () => {
      expect(CharacterPolicy.canRead(null, privateCharacter)).toBe(false);
    });

    it('allows owner to read PRIVATE character', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(CharacterPolicy.canRead(owner, privateCharacter)).toBe(true);
    });

    it('allows campaign DM to read assigned PRIVATE character', () => {
      const dm = makeUser({ id: 'dm-1' });
      expect(CharacterPolicy.canRead(dm, assignedCharacter)).toBe(true);
    });

    it('allows campaign member to read assigned PRIVATE character', () => {
      const member = makeUser({ id: 'member-1' });
      expect(CharacterPolicy.canRead(member, assignedCharacter)).toBe(true);
    });

    it('denies outsider read of PRIVATE character', () => {
      const stranger = makeUser({ id: 'stranger-1' });
      expect(CharacterPolicy.canRead(stranger, privateCharacter)).toBe(false);
      expect(CharacterPolicy.canRead(stranger, assignedCharacter)).toBe(false);
    });

    it('denies read when owner is deactivated', () => {
      const deactivatedOwnerCharacter = {
        ...publicCharacter,
        owner: inactiveOwner,
      };
      expect(CharacterPolicy.canRead(null, deactivatedOwnerCharacter)).toBe(false);
      expect(
        CharacterPolicy.canRead(makeUser({ id: 'stranger-1' }), deactivatedOwnerCharacter),
      ).toBe(false);
      expect(
        CharacterPolicy.canRead(makeUser({ id: 'member-1' }), {
          ...assignedCharacter,
          owner: inactiveOwner,
        }),
      ).toBe(false);
    });

    it('allows ADMIN to read when owner is deactivated', () => {
      const admin = makeUser({ id: 'admin-1', role: Role.ADMIN });
      expect(
        CharacterPolicy.canRead(admin, {
          ...publicCharacter,
          owner: inactiveOwner,
        }),
      ).toBe(true);
    });
  });

  describe('canUpdate', () => {
    it('allows ADMIN bypass', () => {
      const admin = makeUser({ id: 'admin-1', role: Role.ADMIN });
      expect(CharacterPolicy.canUpdate(admin, assignedCharacter)).toBe(true);
    });

    it('allows owner', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(CharacterPolicy.canUpdate(owner, assignedCharacter)).toBe(true);
    });

    it('allows campaign DM', () => {
      const dm = makeUser({ id: 'dm-1' });
      expect(CharacterPolicy.canUpdate(dm, assignedCharacter)).toBe(true);
    });

    it('denies campaign member', () => {
      const member = makeUser({ id: 'member-1' });
      expect(CharacterPolicy.canUpdate(member, assignedCharacter)).toBe(false);
    });

    it('denies outsider', () => {
      const stranger = makeUser({ id: 'stranger-1' });
      expect(CharacterPolicy.canUpdate(stranger, assignedCharacter)).toBe(false);
    });
  });

  describe('canUpdateLiveFields', () => {
    it('allows ADMIN bypass', () => {
      const admin = makeUser({ id: 'admin-1', role: Role.ADMIN });
      expect(CharacterPolicy.canUpdateLiveFields(admin, assignedCharacter)).toBe(true);
    });

    it('allows owner', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(CharacterPolicy.canUpdateLiveFields(owner, assignedCharacter)).toBe(true);
    });

    it('allows campaign DM', () => {
      const dm = makeUser({ id: 'dm-1' });
      expect(CharacterPolicy.canUpdateLiveFields(dm, assignedCharacter)).toBe(true);
    });

    it('denies campaign member', () => {
      const member = makeUser({ id: 'member-1' });
      expect(CharacterPolicy.canUpdateLiveFields(member, assignedCharacter)).toBe(false);
    });

    it('denies outsider', () => {
      const stranger = makeUser({ id: 'stranger-1' });
      expect(CharacterPolicy.canUpdateLiveFields(stranger, assignedCharacter)).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('mirrors canUpdate for owner', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(CharacterPolicy.canDelete(owner, assignedCharacter)).toBe(true);
    });

    it('allows campaign DM', () => {
      const dm = makeUser({ id: 'dm-1' });
      expect(CharacterPolicy.canDelete(dm, assignedCharacter)).toBe(true);
    });

    it('denies campaign member', () => {
      const member = makeUser({ id: 'member-1' });
      expect(CharacterPolicy.canDelete(member, assignedCharacter)).toBe(false);
    });
  });

  describe('canAssignCampaign', () => {
    it('allows ADMIN', () => {
      const admin = makeUser({ id: 'admin-1', role: Role.ADMIN });
      expect(CharacterPolicy.canAssignCampaign(admin, { ownerId: 'owner-1' })).toBe(true);
    });

    it('allows owner', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(CharacterPolicy.canAssignCampaign(owner, { ownerId: 'owner-1' })).toBe(true);
    });

    it('denies non-owner', () => {
      const stranger = makeUser({ id: 'stranger-1' });
      expect(CharacterPolicy.canAssignCampaign(stranger, { ownerId: 'owner-1' })).toBe(false);
    });
  });

  describe('canChangeVisibility', () => {
    it('allows ADMIN', () => {
      const admin = makeUser({ id: 'admin-1', role: Role.ADMIN });
      expect(CharacterPolicy.canChangeVisibility(admin, { ownerId: 'owner-1' })).toBe(true);
    });

    it('allows owner', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(CharacterPolicy.canChangeVisibility(owner, { ownerId: 'owner-1' })).toBe(true);
    });

    it('denies campaign DM', () => {
      const dm = makeUser({ id: 'dm-1' });
      expect(CharacterPolicy.canChangeVisibility(dm, { ownerId: 'owner-1' })).toBe(false);
    });

    it('denies outsider', () => {
      const stranger = makeUser({ id: 'stranger-1' });
      expect(CharacterPolicy.canChangeVisibility(stranger, { ownerId: 'owner-1' })).toBe(false);
    });
  });
});
