import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessageDispatcherService } from './message-dispatcher.service';

@Controller()
export class MessageDispatcherController {
  constructor(private readonly dispatcherService: MessageDispatcherService) {}

  @MessagePattern({ cmd: 'dispatchMessage' })
  async dispatchMessage(
    @Payload() payload: { userId: bigint; contactId: string; prompt: string },
  ) {
    return await this.dispatcherService.dispatchMessage(
      payload.userId,
      payload.contactId,
      payload.prompt,
    );
  }

  @MessagePattern({ cmd: 'generateDraft' })
  async generateDraft(
    @Payload() payload: { userId: bigint; contactId: string; prompt: string },
  ) {
    return await this.dispatcherService.generateDraft(
      payload.userId,
      payload.contactId,
      payload.prompt,
    );
  }

  @MessagePattern({ cmd: 'sendDraft' })
  async sendDraft(
    @Payload() payload: { userId: bigint; contactId: string; historyId: string; message: string; subject?: string },
  ) {
    return await this.dispatcherService.sendDraft(
      payload.userId,
      payload.contactId,
      payload.historyId,
      payload.message,
      payload.subject,
    );
  }
}
