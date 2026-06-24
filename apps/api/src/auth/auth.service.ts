import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';

import { generateSecureToken, hashToken } from '../common/utils/token-hash.util';
import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuthCookieResponse } from './interfaces/auth-cookie.interface';
import { LoginDto } from './dto/login.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthUser } from './interfaces/auth-user.interface';
import { TokenService } from './token.service';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException({
        error: 'EMAIL_ALREADY_EXISTS',
        message: 'Email is already registered',
      });
    }

    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException({
        error: 'USERNAME_ALREADY_EXISTS',
        message: 'Username is already taken',
      });
    }

    const passwordHash = await argon2.hash(dto.password, ARGON2_OPTIONS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        role: Role.USER,
        isActive: true,
      },
      select: this.publicUserSelect(),
    });

    await this.createAndSendVerificationEmail(user.id, user.email);

    return { data: this.toRegisterResponse(user) };
  }

  async login(dto: LoginDto, res: AuthCookieResponse) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        ...this.publicUserSelect(),
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        error: 'ACCOUNT_DEACTIVATED',
        message: 'This account has been deactivated',
      });
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    const authUser = this.toAuthUser(user);
    const accessToken = this.tokenService.generateAccessToken(authUser);
    const { plainToken, tokenHash } = this.tokenService.createRefreshTokenPair();
    await this.tokenService.persistRefreshToken(
      user.id,
      tokenHash,
      this.tokenService.getRefreshExpiresAt(),
    );
    this.tokenService.setRefreshCookie(res, plainToken);

    return {
      data: {
        accessToken,
        user: this.toLoginUserResponse(user),
      },
    };
  }

  async refresh(refreshToken: string | undefined, res: AuthCookieResponse) {
    if (!refreshToken) {
      throw new UnauthorizedException({
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
      });
    }

    const { accessToken } = await this.tokenService.rotateRefreshToken(refreshToken, res);
    return { data: { accessToken } };
  }

  async logout(refreshToken: string | undefined, res: AuthCookieResponse) {
    await this.tokenService.logout(refreshToken, res);
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const tokenHash = hashToken(dto.token);
    const stored = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new BadRequestException({
        error: 'INVALID_VERIFICATION_TOKEN',
        message: 'Invalid or expired verification token',
      });
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.delete({ where: { id: stored.id } }),
    ]);

    return { data: { message: 'Email verified successfully' } };
  }

  async resendVerification(user: AuthUser) {
    if (user.emailVerifiedAt) {
      return { data: { message: 'Email is already verified' } };
    }

    await this.prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
    await this.createAndSendVerificationEmail(user.id, user.email);

    return { data: { message: 'Verification email sent' } };
  }

  async requestPasswordReset(dto: PasswordResetRequestDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (user?.isActive) {
      await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      const plainToken = generateSecureToken();
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(plainToken),
          expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        },
      });

      try {
        await this.emailService.sendPasswordResetEmail(user.email, plainToken);
      } catch (error) {
        this.logger.error(
          'Failed to send password reset email',
          error instanceof Error ? error.message : undefined,
        );
      }
    }

    return {
      data: {
        message: 'If an account with this email exists, a reset link has been sent',
      },
    };
  }

  async confirmPasswordReset(dto: PasswordResetConfirmDto) {
    const tokenHash = hashToken(dto.token);
    const stored = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new BadRequestException({
        error: 'INVALID_RESET_TOKEN',
        message: 'Invalid or expired reset token',
      });
    }

    const passwordHash = await argon2.hash(dto.newPassword, ARGON2_OPTIONS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.delete({ where: { id: stored.id } }),
      this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, isRevoked: false },
        data: { isRevoked: true },
      }),
    ]);

    return { data: { message: 'Password reset successfully' } };
  }

  private async createAndSendVerificationEmail(userId: string, email: string): Promise<void> {
    const plainToken = generateSecureToken();
    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: hashToken(plainToken),
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
    });

    try {
      await this.emailService.sendVerificationEmail(email, plainToken);
    } catch (error) {
      this.logger.error(
        'Failed to send verification email',
        error instanceof Error ? error.message : undefined,
      );
    }
  }

  private publicUserSelect() {
    return {
      id: true,
      email: true,
      username: true,
      role: true,
      avatarUrl: true,
      emailVerifiedAt: true,
      createdAt: true,
    } as const;
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    username: string;
    role: Role;
    isActive: boolean;
    emailVerifiedAt: Date | null;
    avatarUrl: string | null;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      emailVerifiedAt: user.emailVerifiedAt,
      avatarUrl: user.avatarUrl,
    };
  }

  private toRegisterResponse(user: {
    id: string;
    email: string;
    username: string;
    role: Role;
    emailVerifiedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
    };
  }

  private toLoginUserResponse(user: {
    id: string;
    email: string;
    username: string;
    role: Role;
    avatarUrl: string | null;
    emailVerifiedAt: Date | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl,
      emailVerifiedAt: user.emailVerifiedAt,
    };
  }
}
