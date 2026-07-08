import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AvailabilityService } from './availability.service';
import { CheckAvailabilityDto } from './model/check.availability.dto';

@Controller()
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @MessagePattern({ cmd: 'checkAvailability' })
  checkAvailability(@Payload() query: CheckAvailabilityDto) {
    return this.availabilityService.getAvailability(query);
  }
}
