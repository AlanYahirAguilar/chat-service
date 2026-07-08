import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomLoggerService } from '@chat-monorepo/shared';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class TelegramService {
  private botToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLoggerService,
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '';
  }

  async sendMessage(phoneOrUsername: string, message: string) {
    try {
      this.logger.log(`Enviando mensaje a [${phoneOrUsername}]`, 'TELEGRAM');

      if (!this.botToken) {
        throw new Error('TELEGRAM_BOT_TOKEN no configurado');
      }

      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: phoneOrUsername,
          text: message,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Error HTTP ${response.status}: ${JSON.stringify(errData)}`);
      }

      this.logger.log(`Mensaje enviado exitosamente a [${phoneOrUsername}]`, 'TELEGRAM');
      return { success: true };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error enviando mensaje: ${err.message}`, err.stack, 'TELEGRAM');
      return { success: false, error: err.message };
    }
  }
}
