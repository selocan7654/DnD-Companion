import { Role } from '@prisma/client';

import { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { CollectionPolicy } from './collection.policy';

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-id',
    email: 'user@example.com',
    username: 'user',
    role: Role.USER,
    isActive: true,
    emailVerifiedAt: new Date(),
    avatarUrl: null,
    ...overrides,
  };
}

describe('CollectionPolicy', () => {
  const owner = makeUser({ id: 'owner-id' });
  const admin = makeUser({ id: 'admin-id', role: Role.ADMIN });
  const otherUser = makeUser({ id: 'other-id' });

  describe('canRemove', () => {
    it('allows collection owner', () => {
      expect(CollectionPolicy.canRemove(owner, owner.id)).toBe(true);
    });

    it('allows ADMIN bypass', () => {
      expect(CollectionPolicy.canRemove(admin, owner.id)).toBe(true);
    });

    it('denies other user', () => {
      expect(CollectionPolicy.canRemove(otherUser, owner.id)).toBe(false);
    });
  });
});
