import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TelegramService } from './telegram.service';

@Controller()
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @MessagePattern({ cmd: 'sendMessage' })
  async sendMessage(@Payload() data: { phoneOrUsername: string; message: string }) {
    return await this.telegramService.sendMessage(data.phoneOrUsername, data.message);
  }
}
