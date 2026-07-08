import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MailService } from './mail.service';
import { TestEmailDto } from './model/mail.dto';

@Controller()
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @MessagePattern({ cmd: 'testEmail' })
  async testEmail(@Payload() { email }: TestEmailDto) {
    const result = await this.mailService.testConnection(email);
    return {
      success: result,
      message: result
        ? 'Test email sent successfully'
        : 'Failed to send test email',
    };
  }
}
