import { Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Boom } from '@hapi/boom';
import { Injectable, OnModuleInit } from '@nestjs/common';
const {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
import { MessageError, MessageResult } from './model/send.message.dto';
import pino from 'pino';
import * as fs from 'fs';
import * as qrcode from 'qrcode-terminal';
import { CustomLoggerService } from '@syncslot/shared';
@Injectable()
export class WhatsappService implements OnModuleInit {
  private sock: ReturnType<typeof makeWASocket> | null = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' =
    'disconnected';
  private readonly botPhoneNumber = '5217773742556';
  private pairingCodeTimer: NodeJS.Timeout | undefined;
  constructor(private readonly logger: CustomLoggerService) {}
  async onModuleInit() {
    this.logger.log('Inicializando servicio de WhatsApp...', 'WHATSAPP');
    await this.initializeConnection();
  }
  private async initializeConnection() {
    try {
      if (this.connectionStatus !== 'disconnected') {
        this.logger.log(
          `Ya hay una conexión en curso (estado: ${this.connectionStatus}), ignorando...`,
          'WHATSAPP',
        );
        return;
      }
      this.connectionStatus = 'connecting';
      const { state, saveCreds } =
        await useMultiFileAuthState('auth_info_baileys');
      const { version } = await fetchLatestBaileysVersion();
      this.logger.log(`Conectando v${version.join('.')}...`, 'WHATSAPP');
      const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'),
      });
      sock.ev.on('creds.update', () => {
        void saveCreds();
      });
      sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
        if (qr) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
          this.connectionStatus = 'disconnected';
          this.sock = null;
          if (lastDisconnect) {
            const error = (lastDisconnect.error as Boom)?.output?.statusCode;
            this.logger.log(
              `Conexión cerrada. Error code: ${error}, Message: ${(lastDisconnect.error as Error)?.message}`,
              'WHATSAPP',
            );
            if (error === DisconnectReason.loggedOut) {
              this.logger.log(
                'Logged out - limpiando credenciales...',
                'WHATSAPP',
              );
              void this.forceLogout();
            } else if (error !== DisconnectReason.connectionClosed) {
              // 👇 AÑADIR DELAY ANTES DE RECONECTAR
              this.logger.log('Reconectando en 5 segundos...', 'WHATSAPP');
              setTimeout(() => {
                void this.initializeConnection();
              }, 5000);
            }
          }
        } else if (connection === 'open') {
          this.connectionStatus = 'connected';
          this.sock = sock;
          this.logger.log('✅ Conectado exitosamente a WhatsApp!', 'WHATSAPP');
        }
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `[WhatsappService_initializeConnection] ${err.message}`,
        err.stack,
        'EXCEPTION',
      );
      // 👇 DELAY TAMBIÉN EN ERRORES
      setTimeout(() => {
        this.reconnect();
      }, 5000);
    }
  }
  private reconnect() {
    if (this.connectionStatus !== 'connecting') {
      this.connectionStatus = 'disconnected';
      void this.initializeConnection();
    }
  }
  async forceLogout() {
    try {
      this.logger.log('Forzando cierre de sesión...', 'WHATSAPP');
      if (this.sock) {
        try {
          await this.sock.logout();
        } catch (e) {
          /* ignore */
        }
        this.sock = null;
      }
      const authPath = 'auth_info_baileys';
      if (fs.existsSync(authPath)) {
        fs.rmSync(authPath, { recursive: true, force: true });
      }
      this.connectionStatus = 'disconnected';
      await this.initializeConnection();
    } catch (e) {
      /* ignore */
    }
  }
  async sendMessage(
    phone: string,
    message: string | ((...args: unknown[]) => string),
    ...args: unknown[]
  ) {
    try {
      if (this.connectionStatus !== 'connected' || !this.sock) {
        this.logger.log(
          `Intento de envío fallido - WhatsApp no está conectado. Estado: ${this.connectionStatus}`,
          'WHATSAPP',
        );
        return {
          success: false,
          error: 'WhatsApp no está conectado',
        };
      }
      const formattedPhone = this.formatPhoneNumber(phone);
      const formattedMessage =
        typeof message === 'function' ? message(...args) : message;
      this.logger.log(`Enviando mensaje a ${formattedPhone}`, 'WHATSAPP');
      await this.sock.sendMessage(formattedPhone, { text: formattedMessage });
      this.logger.log(
        `Mensaje enviado exitosamente a ${formattedPhone}`,
        'WHATSAPP',
      );
      return { success: true, message: 'Mensaje enviado correctamente' };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `[WhatsappService_sendMessage] ${err.message}`,
        err.stack,
        'EXCEPTION',
      );
      return { success: false, error: err.message };
    }
  }
  async sendBulkMessage(
    phones: string[],
    message: string | ((...args: unknown[]) => string),
    ...args: unknown[]
  ) {
    try {
      if (this.connectionStatus !== 'connected' || !this.sock) {
        this.logger.log(
          `Intento de envío masivo fallido - WhatsApp no está conectado. Estado: ${this.connectionStatus}`,
          'WHATSAPP',
        );
        return {
          success: false,
          total: 0,
          successCount: 0,
          errorCount: 0,
          results: [],
          errors: [],
          error: 'WhatsApp no está conectado',
        };
      }
      this.logger.log(
        `Iniciando envío masivo a ${phones.length} números`,
        'WHATSAPP',
      );
      const results: MessageResult[] = [];
      const errors: MessageError[] = [];
      const formattedMessage =
        typeof message === 'function' ? message(...args) : message;
      for (const phone of phones) {
        try {
          const formattedPhone = this.formatPhoneNumber(phone);
          this.logger.log(`Enviando mensaje a ${formattedPhone}`, 'WHATSAPP');
          await this.sock.sendMessage(formattedPhone, {
            text: formattedMessage,
          });
          results.push({ phone, success: true });
        } catch (error) {
          const err = error as Error;
          this.logger.error(
            `[WhatsappService_sendBulkMessage] ${err.message}`,
            err.stack,
            'EXCEPTION',
          );
          errors.push({ phone, error: err.message });
        }
      }
      const successCount = results.length;
      const errorCount = errors.length;
      this.logger.log(
        `Envío masivo completado: ${successCount} exitosos, ${errorCount} fallidos`,
        'WHATSAPP',
      );
      return {
        success: true,
        total: phones.length,
        successCount,
        errorCount,
        results,
        errors,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `[WhatsappService_sendBulkMessage] ${err.message}`,
        err.stack,
        'EXCEPTION',
      );
      return {
        success: false,
        total: 0,
        successCount: 0,
        errorCount: 0,
        results: [],
        errors: [],
        error: err.message,
      };
    }
  }
  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('52')) {
      cleaned = cleaned.slice(0, 2) + '1' + cleaned.slice(2);
    }
    return `${cleaned}@s.whatsapp.net`;
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
