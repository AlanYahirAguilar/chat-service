import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WaitlistService } from './waitlist.service';
import { JoinWaitlistDto } from './model/join.waitlist.dto';

@Controller()
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @MessagePattern({ cmd: 'joinWaitlist' })
  joinWaitlist(@Payload() data: { dto: JoinWaitlistDto; userId: bigint }) {
    return this.waitlistService.join(data.userId, data.dto);
  }

  @MessagePattern({ cmd: 'leaveWaitlist' })
  leaveWaitlist(@Payload() data: { entryId: bigint; userId: bigint }) {
    return this.waitlistService.leave(data.entryId, data.userId);
  }
}
