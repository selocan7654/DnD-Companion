import { HomebrewStatus, Role, Source } from '@prisma/client';

import { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { HomebrewPolicy } from './homebrew.policy';

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

const draftHomebrew = {
  ownerId: 'owner-1',
  source: Source.HOMEBREW,
  status: HomebrewStatus.DRAFT,
};

const publishedHomebrew = {
  ownerId: 'owner-1',
  source: Source.HOMEBREW,
  status: HomebrewStatus.PUBLISHED,
};

const officialItem = {
  ownerId: null,
  source: Source.PHB,
  status: HomebrewStatus.PUBLISHED,
};

describe('HomebrewPolicy', () => {
  describe('canRead', () => {
    it('allows ADMIN bypass', () => {
      const admin = makeUser({ id: 'admin-1', role: Role.ADMIN });
      expect(HomebrewPolicy.canRead(admin, draftHomebrew)).toBe(true);
    });

    it('allows anyone to read PUBLISHED items', () => {
      expect(HomebrewPolicy.canRead(null, publishedHomebrew)).toBe(true);
      expect(HomebrewPolicy.canRead(makeUser({ id: 'stranger-1' }), publishedHomebrew)).toBe(true);
    });

    it('allows owner to read DRAFT', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(HomebrewPolicy.canRead(owner, draftHomebrew)).toBe(true);
    });

    it('denies non-owner from reading DRAFT', () => {
      const stranger = makeUser({ id: 'stranger-1' });
      expect(HomebrewPolicy.canRead(stranger, draftHomebrew)).toBe(false);
    });

    it('denies guest from reading DRAFT', () => {
      expect(HomebrewPolicy.canRead(null, draftHomebrew)).toBe(false);
    });
  });

  describe('canUpdate', () => {
    it('allows ADMIN bypass on official content', () => {
      const admin = makeUser({ id: 'admin-1', role: Role.ADMIN });
      expect(HomebrewPolicy.canUpdate(admin, officialItem)).toBe(true);
    });

    it('allows owner to update homebrew', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(HomebrewPolicy.canUpdate(owner, draftHomebrew)).toBe(true);
    });

    it('denies non-owner from updating homebrew', () => {
      const stranger = makeUser({ id: 'stranger-1' });
      expect(HomebrewPolicy.canUpdate(stranger, draftHomebrew)).toBe(false);
    });

    it('denies owner from updating official content', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(HomebrewPolicy.canUpdate(owner, officialItem)).toBe(false);
    });
  });

  describe('canDelete', () => {
    it('mirrors canUpdate for owner', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(HomebrewPolicy.canDelete(owner, draftHomebrew)).toBe(true);
    });

    it('denies non-owner', () => {
      const stranger = makeUser({ id: 'stranger-1' });
      expect(HomebrewPolicy.canDelete(stranger, draftHomebrew)).toBe(false);
    });

    it('denies owner on official content', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(HomebrewPolicy.canDelete(owner, officialItem)).toBe(false);
    });
  });

  describe('canPublish', () => {
    it('allows owner', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(HomebrewPolicy.canPublish(owner, draftHomebrew)).toBe(true);
    });

    it('denies non-owner', () => {
      const stranger = makeUser({ id: 'stranger-1' });
      expect(HomebrewPolicy.canPublish(stranger, draftHomebrew)).toBe(false);
    });
  });

  describe('canUnpublish', () => {
    it('allows owner', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(HomebrewPolicy.canUnpublish(owner, publishedHomebrew)).toBe(true);
    });

    it('denies non-owner', () => {
      const stranger = makeUser({ id: 'stranger-1' });
      expect(HomebrewPolicy.canUnpublish(stranger, publishedHomebrew)).toBe(false);
    });
  });
});
