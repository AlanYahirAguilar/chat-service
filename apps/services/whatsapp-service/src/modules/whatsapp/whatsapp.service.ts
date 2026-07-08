import { Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { create, Client, ev } from '@open-wa/wa-automate';
import { writeFileSync } from 'fs';
import { CustomLoggerService } from '@syncslot/shared';
import { MessageResult, MessageError } from './model/send.message.dto';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private client: Client | null = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  constructor(private readonly logger: CustomLoggerService) {}

  async onModuleInit() {
    this.logger.log('Inicializando servicio de WhatsApp con OpenWA...', 'WHATSAPP');
    await this.initializeConnection();
  }

  private qrListenerReady = false;

  private setupQrCapture() {
    if (this.qrListenerReady) return;
    this.qrListenerReady = true;
    // Guarda el QR como imagen PNG escaneable cada vez que OpenWA lo emite
    ev.on('qr.**', (qrcode: string) => {
      try {
        const b64 = qrcode.replace(/^data:image\/png;base64,/, '');
        const outPath = 'C:/Users/Admin/Desktop/wa-qr.png';
        writeFileSync(outPath, b64, 'base64');
        this.logger.log(`📲 QR de WhatsApp guardado en ${outPath} — escanéalo con WhatsApp > Dispositivos vinculados`, 'WHATSAPP');
      } catch (e) {
        this.logger.error(`No se pudo guardar el QR: ${(e as Error).message}`, undefined, 'WHATSAPP');
      }
    });
  }

  private async initializeConnection() {
    try {
      if (this.connectionStatus !== 'disconnected') {
        return;
      }
      this.connectionStatus = 'connecting';
      this.setupQrCapture();
      this.logger.log('Iniciando cliente de OpenWA (Chrome). Se guardará el QR como imagen si se solicita...', 'WHATSAPP');

      this.client = await create({
        sessionId: 'chat_service',
        useChrome: true,
        authTimeout: 0,
        blockCrashLogs: true,
        disableSpins: true,
        headless: true,
        logConsole: false,
        popup: false,
        qrTimeout: 0,
      });

      this.connectionStatus = 'connected';
      this.logger.log('✅ Conectado exitosamente a WhatsApp usando OpenWA!', 'WHATSAPP');
      
      this.client.onStateChanged((state) => {
        this.logger.log(`Estado de WhatsApp: ${state}`, 'WHATSAPP');
        if (state === 'CONFLICT' || state === 'UNLAUNCHED') {
          this.client?.forceRefocus();
        }
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error al inicializar OpenWA: ${err.message}`, err.stack, 'WHATSAPP');
      this.connectionStatus = 'disconnected';
      setTimeout(() => this.initializeConnection(), 5000);
    }
  }

  async sendMessage(phone: string, message: string) {
    try {
      if (this.connectionStatus !== 'connected' || !this.client) {
        throw new Error('WhatsApp no está conectado');
      }
      const formattedPhone = this.formatPhoneNumber(phone);
      this.logger.log(`Enviando mensaje vía OpenWA a ${formattedPhone}`, 'WHATSAPP');
      
      await this.client.sendText(formattedPhone, message);
      
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
    this.logger.log('Cerrando sesión de OpenWA...', 'WHATSAPP');
    if (this.client) {
      await this.client.kill();
      this.client = null;
    }
    this.connectionStatus = 'disconnected';
    return { success: true };
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('52')) {
      cleaned = cleaned.slice(0, 2) + '1' + cleaned.slice(2);
    }
    return `${cleaned}@c.us`; // OpenWA format
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
