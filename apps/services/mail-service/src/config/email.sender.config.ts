import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailerOptions } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { stringConstants } from '@syncslot/shared';

const mailConfig = (configService: ConfigService): MailerOptions => ({
  transport: {
    host: 'smtp.gmail.com', // Servidor SMTP de Gmail
    port: 465, // Puerto seguro SSL/TLS
    secure: true, // true para conexión segura (puerto 465)
    auth: {
      user: configService.get<string>('MAIL_USER'), // Tu dirección de correo electrónico
      pass: configService.get<string>('MAIL_PASSWORD'), // Reemplaza esto con tu contraseña real
    },
  },
  defaults: {
    from: `"${stringConstants.APP_NAME}" <${configService.get<string>('MAIL_USER')}>`, // Nombre remitente y correo electrónico
  },
  template: {
    dir: join(__dirname, '../modules/mail/templates'),
    adapter: new HandlebarsAdapter(),
    options: {
      strict: true,
    },
  },
});

export default mailConfig;
