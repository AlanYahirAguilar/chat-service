import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WhatsappService } from './whatsapp.service';
import { SendMessageDto, SendBulkMessageDto } from './model/send.message.dto';
import { QRResponseDto } from './model/qr.dto';

@Controller()
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

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
}
