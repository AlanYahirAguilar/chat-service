import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ReservationController } from './reservation.controller';
import { ResourceController } from './resource.controller';
import { AvailabilityController } from './availability.controller';
import { WaitlistController } from './waitlist.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    ClientsModule.registerAsync([
      {
        name: 'RESERVATION_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host:
              configService.get<string>('RESERVATION_SERVICE_HOST') ||
              'localhost',
            port: parseInt(
              configService.get<string>('RESERVATION_SERVICE_PORT') || '4010',
              10,
            ),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [
    ReservationController,
    ResourceController,
    AvailabilityController,
    WaitlistController,
  ],
})
export class ReservationModule {}
