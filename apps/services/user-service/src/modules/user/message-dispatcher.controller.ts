import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessageDispatcherService } from './message-dispatcher.service';

@Controller()
export class MessageDispatcherController {
  constructor(private readonly dispatcherService: MessageDispatcherService) {}

  @MessagePattern({ cmd: 'dispatchMessage' })
  async dispatchMessage(@Payload() payload: { contactId: string; prompt: string }) {
    return await this.dispatcherService.dispatchMessage(payload.contactId, payload.prompt);
  }
}
