import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: Role;
  isActive: boolean;
  emailVerifiedAt: Date | null;
  avatarUrl: string | null;
}

export interface JwtPayload {
  sub: string;
  role: Role;
  emailVerified: boolean;
}
