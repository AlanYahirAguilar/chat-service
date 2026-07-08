import { MailerOptions } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { stringConstants } from '@chat-monorepo/shared';

const mailConfig = (configService: ConfigService): MailerOptions => {
  const mailUser = configService.get<string>('MAIL_USER');
  const mailPassword = configService.get<string>('MAIL_PASSWORD');

  if (!mailUser || !mailPassword) {
    console.warn('[MailConfig] ⚠️ MAIL_USER o MAIL_PASSWORD no están configurados en .env');
  }

  return {
    transport: {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL/TLS en puerto 465
      auth: {
        user: mailUser,
        pass: mailPassword,
      },
      tls: {
        // Permite conexiones aunque el certificado no sea perfecto (útil en desarrollo)
        rejectUnauthorized: false,
      },
    },
    defaults: {
      from: `"${stringConstants.APP_NAME}" <${mailUser}>`,
    },
    template: {
      dir: join(__dirname, '../modules/mail/templates'),
      options: {
        strict: false,
      },
    },
  };
};

export default mailConfig;

