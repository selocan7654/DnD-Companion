import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly verificationTokens = new Map<string, string>();
  private readonly passwordResetTokens = new Map<string, string>();

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    this.verificationTokens.set(to, token);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    this.passwordResetTokens.set(to, token);
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
}
