import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { EnvConfig } from '../config/env.validation';

@Injectable()
export class EmailService {
  private readonly transporter: Transporter | null;
  private readonly fromAddress: string;
  private readonly frontendUrl: string;
  private readonly stubMode: boolean;
  private readonly verificationTokens = new Map<string, string>();
  private readonly passwordResetTokens = new Map<string, string>();

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    this.frontendUrl = this.configService.get('FRONTEND_URL', { infer: true });
    this.stubMode = this.shouldUseStubMode();

    const smtpUser = this.configService.get('SMTP_USER', { infer: true });
    const smtpPass = this.configService.get('SMTP_PASS', { infer: true });
    const smtpFrom = this.configService.get('SMTP_FROM', { infer: true });

    this.fromAddress =
      smtpFrom ??
      (smtpUser ? `DnD Companion <${smtpUser}>` : 'DnD Companion <noreply@dnd-companion.local>');

    if (this.stubMode) {
      this.transporter = null;
      return;
    }

    const smtpHost = this.configService.get('SMTP_HOST', { infer: true });
    const smtpPort = this.configService.get('SMTP_PORT', { infer: true });

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    if (this.stubMode) {
      this.verificationTokens.set(to, token);
      return;
    }

    const verifyUrl = `${this.frontendUrl}/verify-email/${token}`;

    await this.transporter!.sendMail({
      from: this.fromAddress,
      to,
      subject: 'Verify your email - DnD Companion',
      html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`,
      text: `Verify your email: ${verifyUrl}`,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    if (this.stubMode) {
      this.passwordResetTokens.set(to, token);
      return;
    }

    const resetUrl = `${this.frontendUrl}/reset-password/${token}`;

    await this.transporter!.sendMail({
      from: this.fromAddress,
      to,
      subject: 'Reset your password - DnD Companion',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
      text: `Reset your password: ${resetUrl}`,
    });
  }

  getVerificationTokenForEmail(email: string): string | undefined {
    return this.verificationTokens.get(email);
  }

  getPasswordResetTokenForEmail(email: string): string | undefined {
    return this.passwordResetTokens.get(email);
  }

  clearTokens(): void {
    this.verificationTokens.clear();
    this.passwordResetTokens.clear();
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
