import { Injectable, OnModuleInit } from '@nestjs/common';
import { CustomLoggerService } from '@chat-monorepo/shared';
import { MessageResult, MessageError } from './model/send.message.dto';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as pino from 'pino';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private sock: any = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private pairedPhoneNumber: string | null = null;

  constructor(private readonly logger: CustomLoggerService) {}

  /**
   * Carpeta de credenciales de Baileys. Configurable con WHATSAPP_AUTH_DIR
   * para montarla en un volumen persistente (Railway/Docker); por defecto
   * usa .baileys_auth junto al proceso, como en desarrollo.
   */
  private get authFolder(): string {
    return process.env.WHATSAPP_AUTH_DIR || path.join(process.cwd(), '.baileys_auth');
  }

  async onModuleInit() {
    this.logger.log(
      'Inicializando servicio de WhatsApp con Baileys (pairing code)...',
      'WHATSAPP',
    );
    // Si hay una sesión guardada, el socket se conecta solo con esas
    // credenciales (sin re-vincular). Si no, queda listo para pairing code.
    await this.createFreshSocket();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Socket creation
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Crea un socket Baileys NUEVO con carpeta de auth limpia.
   * El socket queda en estado "connecting" listo para recibir requestPairingCode.
   */
  private async createFreshSocket(): Promise<void> {
    this.connectionStatus = 'connecting';
    this.sock = null;

    try {
      const authFolder = this.authFolder;
      // Aseguramos que la carpeta exista vacía
      if (!fs.existsSync(authFolder)) {
        fs.mkdirSync(authFolder, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(authFolder);
      // Removemos version forzada para que Baileys use la por defecto,
      // y usamos un browser string genérico que WhatsApp acepta mejor.
      const logger = pino.default({ level: 'silent' });

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger,
        browser: ['Ubuntu', 'Chrome', '129.0.0.0'],
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
        markOnlineOnConnect: false,
      });

      this.sock.ev.on('creds.update', saveCreds);
      this.sock.ev.on('connection.update', (update: any) =>
        this.handleConnectionUpdate(update),
      );

      this.logger.log(
        '🔗 Socket listo. Llama a requestPairingCode con tu número para vincular.',
        'WHATSAPP',
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error al crear socket: ${err.message}`,
        err.stack,
        'WHATSAPP',
      );
      this.connectionStatus = 'disconnected';
      this.sock = null;
    }
  }

  private async handleConnectionUpdate(update: any) {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      this.connectionStatus = 'connected';
      this.logger.log('✅ Conectado exitosamente a WhatsApp!', 'WHATSAPP');
      return;
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;

      this.logger.log(
        `WhatsApp desconectado. Código: ${statusCode}`,
        'WHATSAPP',
      );

      // 515 (restartRequired): WhatsApp lo envía justo después de que el
      // usuario canjea el pairing code. Es OBLIGATORIO recrear el socket con
      // las credenciales recién guardadas para completar el login. Si se
      // ignora, el teléfono siempre muestra "No se pudo vincular".
      if (statusCode === DisconnectReason.restartRequired) {
        this.logger.log(
          '🔄 Pairing exitoso. Reiniciando socket para completar el login...',
          'WHATSAPP',
        );
        await this.startExistingSession();
        return;
      }

      if (this.connectionStatus === 'connected') {
        // Pérdida de conexión estando activo → reconectar con sesión existente
        this.connectionStatus = 'disconnected';
        if (!isLoggedOut) {
          this.logger.log('Reconectando en 5s...', 'WHATSAPP');
          setTimeout(() => this.startExistingSession(), 5000);
        } else {
          this.logger.log('Sesión cerrada por el usuario.', 'WHATSAPP');
          await this.clearAuthFolder();
          this.sock = null;
          this.connectionStatus = 'disconnected';
        }
        return;
      }

      // Close durante el emparejamiento (p.ej. timeout "QR refs attempts
      // ended"): el socket quedó muerto y un código pendiente ya no se puede
      // canjear. Marcamos desconectado y creamos un socket fresco para que el
      // usuario pueda solicitar un código nuevo de inmediato.
      if (!isLoggedOut) {
        this.connectionStatus = 'disconnected';
        this.logger.log(
          'Socket cerrado durante la vinculación. Creando socket nuevo en 3s... (solicita un código nuevo)',
          'WHATSAPP',
        );
        setTimeout(() => {
          // Solo recrear si nadie más (p.ej. requestPairingCode) ya creó uno
          if (this.connectionStatus === 'disconnected') {
            this.createFreshSocket();
          }
        }, 3000);
      } else {
        this.sock = null;
        this.connectionStatus = 'disconnected';
      }
    }
  }

  /** Reconecta usando credenciales ya guardadas (sesión previa válida) */
  private async startExistingSession() {
    this.connectionStatus = 'connecting';
    try {
      const authFolder = this.authFolder;
      const { state, saveCreds } = await useMultiFileAuthState(authFolder);
      const logger = pino.default({ level: 'silent' });

      this.destroySocket();

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger,
        browser: ['Ubuntu', 'Chrome', '129.0.0.0'],
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
        markOnlineOnConnect: false,
      });

      this.sock.ev.on('creds.update', saveCreds);
      this.sock.ev.on('connection.update', (update: any) =>
        this.handleConnectionUpdate(update),
      );
    } catch (err: any) {
      this.logger.error(`Error en reconexión: ${err.message}`, err.stack, 'WHATSAPP');
      this.connectionStatus = 'disconnected';
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Pairing code
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Solicita un código de 8 dígitos para vincular WhatsApp sin QR.
   * El usuario lo ingresa en: Ajustes → Dispositivos vinculados → Vincular con número.
   * phoneNumber: solo dígitos con código de país, ej. "527775012348"
   */
  async requestPairingCode(phoneNumber: string): Promise<{ code: string }> {
    if (this.connectionStatus === 'connected') {
      throw new Error('WhatsApp ya está conectado. No es necesario vincular.');
    }

    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 10) {
      throw new Error('Número inválido. Usa formato con código de país, ej: 521XXXXXXXXXX');
    }

    this.logger.log(`Preparando pairing code para +${cleaned}...`, 'WHATSAPP');

    // Siempre creamos un socket fresco para evitar el error "Connection Closed"
    // causado por sockets inactivos que WhatsApp cierra automáticamente.
    this.destroySocket();

    await this.clearAuthFolder();
    await this.createFreshSocket();

    // Damos tiempo suficiente (5 segundos) para que el WebSocket establezca la conexión real
    this.logger.log('Esperando conexión del WebSocket (5s)...', 'WHATSAPP');
    await new Promise(r => setTimeout(r, 5000));

    if (!this.sock) {
      throw new Error('No se pudo inicializar el socket. Intenta de nuevo.');
    }

    this.logger.log(`Solicitando código de emparejamiento para +${cleaned}...`, 'WHATSAPP');
    try {
      const code: string = await this.sock.requestPairingCode(cleaned);
      this.pairedPhoneNumber = cleaned;
      this.logger.log(`✅ Código generado: ${code}`, 'WHATSAPP');
      return { code };
    } catch (err: any) {
      this.logger.error(
        `Error al solicitar pairing code: ${err.message}`,
        err.stack,
        'WHATSAPP',
      );
      throw new Error(`No se pudo generar el código: ${err.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Reconnect / Logout
  // ─────────────────────────────────────────────────────────────────────────────

  async reconnect(): Promise<{ success: boolean }> {
    this.logger.log('Reconexión manual iniciada...', 'WHATSAPP');
    this.destroySocket();
    this.connectionStatus = 'disconnected';
    await this.clearAuthFolder();
    await this.createFreshSocket();
    return { success: true };
  }

  async forceLogout() {
    this.logger.log('Cerrando sesión de WhatsApp...', 'WHATSAPP');
    if (this.sock) {
      try { await this.sock.logout(); } catch (_) {}
      this.destroySocket();
    }
    await this.clearAuthFolder();
    this.connectionStatus = 'disconnected';
    this.pairedPhoneNumber = null;
    return { success: true };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Messaging
  // ─────────────────────────────────────────────────────────────────────────────

  async sendMessage(phone: string, message: string) {
    try {
      if (this.connectionStatus !== 'connected' || !this.sock) {
        throw new Error(
          'WhatsApp no está conectado. Vincula primero con requestPairingCode.',
        );
      }

      const formattedPhone = this.formatPhoneNumber(phone);
      this.logger.log(`Enviando mensaje a ${formattedPhone}`, 'WHATSAPP');

      const [result] = await this.sock.onWhatsApp(formattedPhone);
      if (!result?.exists) {
        throw new Error('El número no existe en WhatsApp');
      }

      await this.sock.sendPresenceUpdate('composing', result.jid);
      const delay = Math.floor(Math.random() * (10000 - 4000 + 1)) + 4000;
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Cierra un socket quitando primero sus listeners para que su evento
   * "close" no dispare el handler y ensucie el estado ni los logs.
   */
  private destroySocket() {
    if (!this.sock) return;
    try { this.sock.ev.removeAllListeners('connection.update'); } catch (_) {}
    try { this.sock.ev.removeAllListeners('creds.update'); } catch (_) {}
    try { this.sock.end(undefined); } catch (_) {}
    this.sock = null;
  }

  private async clearAuthFolder() {
    const authFolder = this.authFolder;
    try {
      if (fs.existsSync(authFolder)) {
        fs.rmSync(authFolder, { recursive: true, force: true });
        this.logger.log('Carpeta de autenticación eliminada.', 'WHATSAPP');
      }
    } catch (e) {
      this.logger.error(
        `No se pudo limpiar la carpeta auth: ${(e as Error).message}`,
        undefined,
        'WHATSAPP',
      );
    }
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('52')) {
      cleaned = cleaned.slice(0, 2) + '1' + cleaned.slice(2);
    }
    return cleaned;
  }

  getQRCode(): string | null {
    return null;
  }

  getConnectionStatus() {
    return {
      status: this.connectionStatus,
      qrRequired: false,
      qrData: null,
      pairingCodeRequired: this.connectionStatus !== 'connected',
      pairedPhone: this.pairedPhoneNumber,
    };
  }
}
