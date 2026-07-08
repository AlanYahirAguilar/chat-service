import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import typeOrmConfig from './config/type.orm.config';
import { AvailabilityModule } from './modules/availability/availability.module';
import { ReservationModule } from './modules/reservation/reservation.module';
import { ResourceModule } from './modules/resource/resource.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';
import { SharedClientsModule } from './common/shared.clients.module';

import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from '@syncslot/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    LoggerModule,
    typeOrmConfig,
    SharedClientsModule,
    AvailabilityModule,
    ReservationModule,
    ResourceModule,
    WaitlistModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
