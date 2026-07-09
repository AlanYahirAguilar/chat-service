import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomLoggerService } from '@chat-monorepo/shared';

@Injectable()
export class TelegramService implements OnModuleInit {
  private botToken: string;
  private botUsername: string | null = null;
  private isReady = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLoggerService,
  ) {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || '';
  }

  async onModuleInit() {
    this.logger.log('Inicializando servicio de Telegram...', 'TELEGRAM');
    await this.verifyBot();
  }

  /** Verifica que el token sea válido y el bot esté activo (getMe) */
  private async verifyBot() {
    if (!this.botToken) {
      this.logger.error('TELEGRAM_BOT_TOKEN no está configurado en .env', undefined, 'TELEGRAM');
      return;
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/getMe`;
      const response = await fetch(url, { method: 'GET' });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(errData)}`);
      }

      const data: any = await response.json();
      if (data.ok && data.result) {
        this.botUsername = data.result.username;
        this.isReady = true;
        this.logger.log(
          `✅ Bot de Telegram conectado: @${this.botUsername} (${data.result.first_name})`,
          'TELEGRAM',
        );
      } else {
        throw new Error(`Respuesta inesperada: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `❌ Error al verificar el bot de Telegram: ${err.message}`,
        err.stack,
        'TELEGRAM',
      );
    }
  }

  async sendMessage(phoneOrUsername: string, message: string) {
    try {
      this.logger.log(`Enviando mensaje a [${phoneOrUsername}]`, 'TELEGRAM');

      if (!this.botToken) {
        throw new Error('TELEGRAM_BOT_TOKEN no configurado');
      }

      if (!this.isReady) {
        this.logger.log('Bot no verificado, reintentando verificación...', 'TELEGRAM');
        await this.verifyBot();
        if (!this.isReady) {
          throw new Error('El bot de Telegram no está disponible. Verifica el token en .env');
        }
      }

      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: phoneOrUsername,
          text: message,
          parse_mode: 'HTML',
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

  getBotStatus() {
    return {
      isReady: this.isReady,
      botUsername: this.botUsername,
    };
  }
}
