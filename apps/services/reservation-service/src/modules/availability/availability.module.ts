import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { Resource } from '@/modules/resource/entity/resource.entity';
import { Reservation } from '@/modules/reservation/entity/reservation.entity';

import { AvailabilityCalculatorService } from './availability.calculator.service';
import { AvailabilitySubscriber } from './availability.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([Resource, Reservation])],
  controllers: [AvailabilityController],
  providers: [
    AvailabilityService,
    AvailabilityCalculatorService,
    AvailabilitySubscriber,
  ],
})
export class AvailabilityModule {}
