import { Role } from '@prisma/client';

import { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { DmNotePolicy } from './dm-note.policy';

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

const campaign = { ownerId: 'owner-1' };

describe('DmNotePolicy', () => {
  describe('canRead', () => {
    it('allows ADMIN bypass', () => {
      const admin = makeUser({ id: 'admin-1', role: Role.ADMIN });
      expect(DmNotePolicy.canRead(admin, campaign)).toBe(true);
    });

    it('allows campaign owner (DM)', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(DmNotePolicy.canRead(owner, campaign)).toBe(true);
    });

    it('denies campaign member', () => {
      const member = makeUser({ id: 'member-1' });
      expect(DmNotePolicy.canRead(member, campaign)).toBe(false);
    });

    it('denies outsider', () => {
      const stranger = makeUser({ id: 'stranger-1' });
      expect(DmNotePolicy.canRead(stranger, campaign)).toBe(false);
    });
  });

  describe('canWrite', () => {
    it('allows ADMIN bypass', () => {
      const admin = makeUser({ id: 'admin-1', role: Role.ADMIN });
      expect(DmNotePolicy.canWrite(admin, campaign)).toBe(true);
    });

    it('allows campaign owner (DM)', () => {
      const owner = makeUser({ id: 'owner-1' });
      expect(DmNotePolicy.canWrite(owner, campaign)).toBe(true);
    });

    it('denies campaign member', () => {
      const member = makeUser({ id: 'member-1' });
      expect(DmNotePolicy.canWrite(member, campaign)).toBe(false);
    });

    it('denies outsider', () => {
      const stranger = makeUser({ id: 'stranger-1' });
      expect(DmNotePolicy.canWrite(stranger, campaign)).toBe(false);
    });
  });
});
