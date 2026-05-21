import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly smtpConfigured: boolean;

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {
    this.smtpConfigured = !!(
      configService.get<string>('SMTP_HOST') &&
      configService.get<string>('SMTP_USER') &&
      configService.get<string>('SMTP_PASS')
    );
    if (!this.smtpConfigured) {
      this.logger.warn(
        'SMTP not configured. Emails will be logged to console instead.',
      );
    }
  }

  private async sendMail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    if (!this.smtpConfigured) {
      this.logger.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      return;
    }

    try {
      await this.mailerService.sendMail({ to, subject, html });
      this.logger.log(`Email sent to ${to} — ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to} — ${subject}`, error);
    }
  }

  async sendResetPasswordEmail(to: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL')!;
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Reset Your Password</h2>
          <p>You requested a password reset. Click the link below to set a new password:</p>
          <p><a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
          <p>Or copy this URL into your browser:</p>
          <p>${resetLink}</p>
          <p>This link expires in 1 hour.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </body>
      </html>
    `;

    await this.sendMail(to, 'Reset Your Password', html);
  }

  async sendSetupPasswordEmail(
    to: string,
    token: string,
    projectName?: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL')!;
    const setupLink = `${frontendUrl}/setup-password?token=${token}`;

    const projectIntro = projectName
      ? `You've been invited to join <strong>${projectName}</strong> on EnvMemo.`
      : `You've been invited to join a project on EnvMemo.`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Set Up Your Password</h2>
          <p>${projectIntro} Click the link below to set your password and get started:</p>
          <p><a href="${setupLink}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">Set Up Password</a></p>
          <p>Or copy this URL into your browser:</p>
          <p>${setupLink}</p>
          <p>Welcome aboard!</p>
        </body>
      </html>
    `;

    await this.sendMail(to, 'Set Up Your Password', html);
  }

  async sendWelcomeEmail(to: string, name?: string): Promise<void> {
    const greeting = name ? `Hi ${name},` : 'Hi there,';

    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to EnvMemo!</h2>
          <p>${greeting}</p>
          <p>Your account has been created successfully. You can now log in and start managing your environment variables.</p>
          <p>Welcome aboard!</p>
        </body>
      </html>
    `;

    await this.sendMail(to, 'Welcome to EnvMemo!', html);
  }
}
