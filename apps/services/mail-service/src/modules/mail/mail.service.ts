import { Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import {
  sendTestNotificationMessage,
  generatedMessageTemplate,
} from './templates/email.templates';
import { stringConstants } from '@syncslot/shared';
import { CustomLoggerService } from '@syncslot/shared';
@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private readonly logger: CustomLoggerService,
  ) {}
  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<boolean> {
    try {
      this.logger.log(`Enviando correo a ${options.to}`, 'EMAIL');
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      this.logger.log(`Correo enviado exitosamente a ${options.to}`, 'EMAIL');
      return true;
    } catch (error) {
      this.logger.error(
        `[MailService_sendMail] ${error.message}`,
        error.stack,
        'EXCEPTION',
      );
      throw error;
    }
  }
  /**
   * Envía un correo generado por la IA. Recibe el cuerpo en texto plano
   * (redactado con el tono del contacto) y lo envuelve en una plantilla HTML.
   */
  async sendGeneratedMail(options: {
    to: string;
    subject: string;
    body: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.log(`Enviando correo generado a ${options.to}`, 'EMAIL');
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject || 'Nuevo mensaje',
        html: generatedMessageTemplate(options.body),
      });
      this.logger.log(`Correo enviado exitosamente a ${options.to}`, 'EMAIL');
      return { success: true };
    } catch (error) {
      this.logger.error(
        `[MailService_sendGeneratedMail] ${error.message}`,
        error.stack,
        'EXCEPTION',
      );
      return { success: false, error: error.message };
    }
  }

  // Método para verificar la configuración del sistema de correo
  async testConnection(email: string): Promise<boolean> {
    try {
      this.logger.log(`Enviando correo de prueba a ${email}`, 'EMAIL');
      const html = sendTestNotificationMessage();
      await this.mailerService.sendMail({
        to: email,
        subject: `${stringConstants.APP_NAME} - Email Test`,
        html: html,
      });
      this.logger.log(
        `Correo de prueba enviado exitosamente a ${email}`,
        'EMAIL',
      );
      return true;
    } catch (error) {
      this.logger.error(
        `[MailService_testConnection] ${error.message}`,
        error.stack,
        'EXCEPTION',
      );
      return false;
    }
  }
}
