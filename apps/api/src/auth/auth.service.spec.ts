import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../common/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

describe('AuthService', () => {
  let service: AuthService;
  let emailService: {
    getVerificationTokenForEmail: jest.Mock;
    buildVerificationUrl: jest.Mock;
  };

  beforeEach(async () => {
    emailService = {
      getVerificationTokenForEmail: jest.fn(),
      buildVerificationUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: {} },
        { provide: TokenService, useValue: {} },
        { provide: EmailService, useValue: emailService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('getDevVerificationToken', () => {
    it('returns verification token data when pending token exists', () => {
      emailService.getVerificationTokenForEmail.mockReturnValue('plain-token');
      emailService.buildVerificationUrl.mockReturnValue(
        'http://localhost:5173/verify-email/plain-token',
      );

      const result = service.getDevVerificationToken('player@test.local');

      expect(result).toEqual({
        data: {
          verifyUrl: 'http://localhost:5173/verify-email/plain-token',
          token: 'plain-token',
        },
      });
    });

    it('throws NotFoundException when no pending token exists', () => {
      emailService.getVerificationTokenForEmail.mockReturnValue(null);

      expect(() => service.getDevVerificationToken('missing@test.local')).toThrow(
        NotFoundException,
      );
    });
  });
});
