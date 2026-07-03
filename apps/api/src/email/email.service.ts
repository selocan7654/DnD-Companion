import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { EnvConfig } from '../config/env.validation';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter | null;
  private readonly fromAddress: string;
  private readonly frontendUrl: string;
  private readonly stubMode: boolean;
  private readonly isDevelopment: boolean;
  private readonly verificationTokens = new Map<string, string>();
  private readonly passwordResetTokens = new Map<string, string>();

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    this.frontendUrl = this.configService.get('FRONTEND_URL', { infer: true });
    const nodeEnv = this.configService.get('NODE_ENV', { infer: true });
    this.isDevelopment = nodeEnv === 'development';
    this.stubMode = this.shouldUseStubMode();

    const smtpUser = this.configService.get('SMTP_USER', { infer: true });
    const smtpPass = this.configService.get('SMTP_PASS', { infer: true });
    const smtpFrom = this.configService.get('SMTP_FROM', { infer: true });

    this.fromAddress =
      smtpFrom ??
      (smtpUser ? `DnD Companion <${smtpUser}>` : 'DnD Companion <noreply@dnd-companion.local>');

    if (this.stubMode) {
      this.transporter = null;
      if (this.isDevelopment) {
        this.logger.log(
          'Email stub mode active (SMTP_USER/SMTP_PASS empty or NODE_ENV=test). Verification links are logged to the console.',
        );
      }
      return;
    }

    const smtpHost = this.configService.get('SMTP_HOST', { infer: true });
    const smtpPort = this.configService.get('SMTP_PORT', { infer: true });

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      requireTLS: smtpPort === 587,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    if (this.isDevelopment) {
      this.logger.log(`Email SMTP mode active (${smtpHost}:${smtpPort}).`);
    }
  }

  isStubMode(): boolean {
    return this.stubMode;
  }

  buildVerificationUrl(token: string): string {
    return `${this.frontendUrl}/verify-email/${token}`;
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const normalizedEmail = this.normalizeEmail(to);
    const verifyUrl = this.buildVerificationUrl(token);

    this.storeVerificationToken(normalizedEmail, token);

    if (this.isDevelopment) {
      this.logger.log(`[DEV] Email verification link: ${verifyUrl}`);
    }

    if (this.stubMode) {
      return;
    }

    await this.transporter!.sendMail({
      from: this.fromAddress,
      to: normalizedEmail,
      subject: 'Verify your email - DnD Companion',
      html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`,
      text: `Verify your email: ${verifyUrl}`,
    });

    if (this.isDevelopment) {
      this.logger.log(
        `[DEV] Verification email sent via SMTP to ${this.maskEmail(normalizedEmail)}`,
      );
    }
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const normalizedEmail = this.normalizeEmail(to);
    const resetUrl = `${this.frontendUrl}/reset-password/${token}`;

    if (this.stubMode) {
      this.passwordResetTokens.set(normalizedEmail, token);
      if (this.isDevelopment) {
        this.logger.log(`[DEV] Password reset link: ${resetUrl}`);
      }
      return;
    }

    await this.transporter!.sendMail({
      from: this.fromAddress,
      to: normalizedEmail,
      subject: 'Reset your password - DnD Companion',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
      text: `Reset your password: ${resetUrl}`,
    });
  }

  getVerificationTokenForEmail(email: string): string | undefined {
    return this.verificationTokens.get(this.normalizeEmail(email));
  }

  getPasswordResetTokenForEmail(email: string): string | undefined {
    return this.passwordResetTokens.get(this.normalizeEmail(email));
  }

  clearTokens(): void {
    this.verificationTokens.clear();
    this.passwordResetTokens.clear();
  }

  private storeVerificationToken(email: string, token: string): void {
    if (this.stubMode || this.isDevelopment) {
      this.verificationTokens.set(email, token);
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) {
      return '[redacted]';
    }

    const visible = local.length <= 2 ? (local[0] ?? '*') : `${local.slice(0, 2)}***`;
    return `${visible}@${domain}`;
  }

  private shouldUseStubMode(): boolean {
    const nodeEnv = this.configService.get('NODE_ENV', { infer: true });
    if (nodeEnv === 'test') {
      return true;
    }

    const smtpUser = this.configService.get('SMTP_USER', { infer: true });
    const smtpPass = this.configService.get('SMTP_PASS', { infer: true });

    return !smtpUser || !smtpPass;
  }
}
