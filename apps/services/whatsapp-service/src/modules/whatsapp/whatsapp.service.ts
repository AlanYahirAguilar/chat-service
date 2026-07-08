import { Injectable, OnModuleInit } from '@nestjs/common';
import { CustomLoggerService } from '@chat-monorepo/shared';
import { MessageResult, MessageError } from './model/send.message.dto';
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as pino from 'pino';
import * as path from 'path';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private sock: any = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  constructor(private readonly logger: CustomLoggerService) {}

  async onModuleInit() {
    this.logger.log('Inicializando servicio de WhatsApp con Baileys...', 'WHATSAPP');
    await this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      if (this.connectionStatus === 'connected') {
        return;
      }
      this.connectionStatus = 'connecting';

      const authFolder = path.join(process.cwd(), '.baileys_auth');
      const { state, saveCreds } = await useMultiFileAuthState(authFolder);

      const logger = pino.default({ level: 'silent' });

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger,
        browser: ['ChatMonorepo', 'Chrome', '1.0.0']
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const qrcode = require('qrcode-terminal');
            qrcode.generate(qr, { small: true });
            this.logger.log(`📲 Escanea el código QR en la terminal 👆`, 'WHATSAPP');
          } catch (e) {
            this.logger.error(`No se pudo mostrar el QR: ${(e as Error).message}`, undefined, 'WHATSAPP');
          }
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
          this.logger.log(`WhatsApp desconectado. Razón: ${lastDisconnect?.error}. Reconectando: ${shouldReconnect}`, 'WHATSAPP');
          
          this.connectionStatus = 'disconnected';
          
          if (shouldReconnect) {
            setTimeout(() => this.initializeConnection(), 5000);
          } else {
            this.sock = null;
          }
        } else if (connection === 'open') {
          this.connectionStatus = 'connected';
          this.logger.log('✅ Conectado exitosamente a WhatsApp usando Baileys!', 'WHATSAPP');
        }
      });

    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error al inicializar WhatsApp: ${err.message}`, err.stack, 'WHATSAPP');
      this.connectionStatus = 'disconnected';
      setTimeout(() => this.initializeConnection(), 5000);
    }
  }

  async sendMessage(phone: string, message: string) {
    try {
      if (this.connectionStatus !== 'connected' || !this.sock) {
        throw new Error('WhatsApp no está conectado');
      }
      const formattedPhone = this.formatPhoneNumber(phone);
      this.logger.log(`Enviando mensaje a ${formattedPhone}`, 'WHATSAPP');
      
      const [result] = await this.sock.onWhatsApp(formattedPhone);
      if (!result?.exists) {
         throw new Error('El número no existe en WhatsApp');
      }
      
      // Medidas anti-baneo: Simular estado "Escribiendo..." y delay aleatorio
      await this.sock.sendPresenceUpdate('composing', result.jid);
      const delay = Math.floor(Math.random() * (10000 - 4000 + 1)) + 4000; // Entre 4 y 10 segundos
      await new Promise(resolve => setTimeout(resolve, delay));
      await this.sock.sendPresenceUpdate('paused', result.jid);

      await this.sock.sendMessage(result.jid, { text: message });
      
      this.logger.log(`Mensaje enviado exitosamente a ${formattedPhone}`, 'WHATSAPP');
      return { success: true, message: 'Mensaje enviado correctamente' };
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error enviando mensaje: ${err.message}`, err.stack, 'WHATSAPP');
      return { success: false, error: err.message };
    }
  }

  async sendBulkMessage(phones: string[], message: string) {
    const results: MessageResult[] = [];
    const errors: MessageError[] = [];
    
    for (const phone of phones) {
      const res = await this.sendMessage(phone, message);
      if (res.success) {
        results.push({ phone, success: true });
      } else {
        errors.push({ phone, error: res.error || 'Error' });
      }
    }
    
    return {
      success: true,
      total: phones.length,
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors,
    };
  }

  async forceLogout() {
    this.logger.log('Cerrando sesión de WhatsApp...', 'WHATSAPP');
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
    }
    this.connectionStatus = 'disconnected';
    return { success: true };
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('52')) {
      cleaned = cleaned.slice(0, 2) + '1' + cleaned.slice(2);
    }
    return `${cleaned}`; 
  }

  getQRCode(): string | null {
    return this.connectionStatus;
  }

  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      qrRequired: this.connectionStatus === 'disconnected',
    };
  }
}
