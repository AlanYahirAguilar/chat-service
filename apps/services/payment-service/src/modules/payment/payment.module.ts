import { ClientsModule, Transport } from '@nestjs/microservices';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentGatewayService } from './payment.gateway.service';
import { Payment } from './entity/payment.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    ClientsModule.registerAsync([
      {
        name: 'IAM_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('IAM_SERVICE_HOST') || 'localhost',
            port: parseInt(configService.get<string>('IAM_SERVICE_PORT') || '4003', 10),
          },
        }),
      },
      {
        name: 'RESERVATION_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('RESERVATION_SERVICE_HOST') || 'localhost',
            port: parseInt(configService.get<string>('RESERVATION_SERVICE_PORT') || '4010', 10),
          },
        }),
      },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentGatewayService],
  exports: [PaymentService, PaymentGatewayService],
})
export class PaymentModule {}
