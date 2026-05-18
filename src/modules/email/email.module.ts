import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service.js';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('SMTP_HOST'),
          port: Number(config.get<number>('SMTP_PORT')),
          secure: Number(config.get<number>('SMTP_PORT')) === 465,
          auth: {
            user: config.get<string>('SMTP_USER') ?? '',
            pass: config.get<string>('SMTP_PASS') ?? '',
          },
        },
        defaults: {
          from: `"EnvMemo" <${config.get<string>('EMAIL_FROM')}>`,
        },
      }),
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
