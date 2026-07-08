import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';

import { PrismaService } from '../common/prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.meSelect(),
    });

    if (!user) {
      throw new NotFoundException();
    }

    return { data: this.toMeResponse(user) };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.username) {
      const existing = await this.prisma.user.findFirst({
        where: {
          username: dto.username,
          NOT: { id: userId },
        },
      });

      if (existing) {
        throw new ConflictException({
          error: 'USERNAME_ALREADY_EXISTS',
          message: 'Username is already taken',
        });
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.username !== undefined && { username: dto.username }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      select: this.meSelect(),
    });

    return { data: this.toMeResponse(user) };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException();
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!passwordValid) {
      throw new UnauthorizedException({
        error: 'INVALID_CURRENT_PASSWORD',
        message: 'Current password is incorrect',
      });
    }

    const passwordHash = await argon2.hash(dto.newPassword, ARGON2_OPTIONS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      }),
    ]);
  }

  async getPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new NotFoundException();
    }

    return {
      data: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  private meSelect() {
    return {
      id: true,
      email: true,
      username: true,
      avatarUrl: true,
      role: true,
      isActive: true,
      emailVerifiedAt: true,
      createdAt: true,
    } as const;
  }

  private toMeResponse(user: {
    id: string;
    email: string;
    username: string;
    avatarUrl: string | null;
    role: string;
    isActive: boolean;
    emailVerifiedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isActive: user.isActive,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
    };
  }
}
