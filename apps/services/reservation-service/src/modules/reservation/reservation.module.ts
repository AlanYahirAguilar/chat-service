import { ClientsModule, Transport } from '@nestjs/microservices';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { Reservation } from './entity/reservation.entity';
import { WaitlistEntry } from '../waitlist/entity/waitlist.entity';
import { ReservationSubscriber } from './reservation.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, WaitlistEntry]),
  ],
  controllers: [ReservationController],
  providers: [ReservationService, ReservationSubscriber],
})
export class ReservationModule {}
