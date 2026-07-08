import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WhatsappService } from './whatsapp.service';
import { SendMessageDto, SendBulkMessageDto } from './model/send.message.dto';
import { QRResponseDto } from './model/qr.dto';

@Controller()
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) { }

  @MessagePattern({ cmd: 'sendMessage' })
  async sendMessage(@Payload() body: SendMessageDto) {
    return await this.whatsappService.sendMessage(body.phone, body.message);
  }

  @MessagePattern({ cmd: 'sendBulkMessage' })
  async sendBulkMessage(@Payload() body: SendBulkMessageDto) {
    return await this.whatsappService.sendBulkMessage(
      body.phones,
      body.message,
    );
  }

  /** Retorna el estado de conexión y si se necesita vincular con código */
  @MessagePattern({ cmd: 'getQRCode' })
  getQRCode(): QRResponseDto {
    const qrCode = this.whatsappService.getQRCode();
    const status = this.whatsappService.getConnectionStatus();

    return {
      qrCode,
      ...status,
    };
  }

  @MessagePattern({ cmd: 'forceLogout' })
  async forceLogout() {
    return await this.whatsappService.forceLogout();
  }

  /**
   * Vincula WhatsApp mediante código de 8 dígitos (pairing code).
   * El teléfono debe incluir código de país sin +, p.ej. "521XXXXXXXXXX".
   * WhatsApp mostrará el código en: Ajustes → Dispositivos vinculados → Vincular con número.
   */
  @MessagePattern({ cmd: 'requestPairingCode' })
  async requestPairingCode(@Payload() body: { phoneNumber: string }) {
    try {
      return await this.whatsappService.requestPairingCode(body.phoneNumber);
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  /** Fuerza una reconexión completa del socket */
  @MessagePattern({ cmd: 'reconnect' })
  async reconnect() {
    return await this.whatsappService.reconnect();
  }
}
