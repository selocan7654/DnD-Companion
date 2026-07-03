import { ConfigService } from '@nestjs/config';

import { EmailService } from './email.service';

function createEmailService(env: Record<string, string | number | undefined>): EmailService {
  const configService = {
    get: (key: string) => env[key],
  } as ConfigService;

  return new EmailService(configService);
}

describe('EmailService', () => {
  const baseEnv = {
    FRONTEND_URL: 'http://localhost:5173',
    SMTP_HOST: 'smtp.gmail.com',
    SMTP_PORT: 587,
  };

  it('uses stub mode when SMTP credentials are missing', () => {
    const service = createEmailService({
      ...baseEnv,
      NODE_ENV: 'development',
      SMTP_USER: undefined,
      SMTP_PASS: undefined,
    });

    expect(service.isStubMode()).toBe(true);
  });

  it('stores verification token in development even when SMTP is configured', async () => {
    const service = createEmailService({
      ...baseEnv,
      NODE_ENV: 'development',
      SMTP_USER: 'user@gmail.com',
      SMTP_PASS: 'app-password',
    });

    const sendMail = jest.fn().mockResolvedValue({});
    (service as unknown as { transporter: { sendMail: jest.Mock } }).transporter = {
      sendMail,
    };

    await service.sendVerificationEmail('User@Example.com', 'plain-token');

    expect(service.getVerificationTokenForEmail('user@example.com')).toBe('plain-token');
    expect(service.buildVerificationUrl('plain-token')).toBe(
      'http://localhost:5173/verify-email/plain-token',
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
      }),
    );
  });

  it('does not expose verification tokens outside development when SMTP is configured', async () => {
    const service = createEmailService({
      ...baseEnv,
      NODE_ENV: 'production',
      SMTP_USER: 'user@gmail.com',
      SMTP_PASS: 'app-password',
    });

    const sendMail = jest.fn().mockResolvedValue({});
    (service as unknown as { transporter: { sendMail: jest.Mock } }).transporter = {
      sendMail,
    };

    await service.sendVerificationEmail('user@example.com', 'plain-token');

    expect(service.getVerificationTokenForEmail('user@example.com')).toBeUndefined();
  });
});
