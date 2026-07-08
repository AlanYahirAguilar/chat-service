import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'WHATSAPP_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host:
              configService.get<string>('WHATSAPP_SERVICE_HOST') || 'localhost',
            port: parseInt(
              configService.get<string>('WHATSAPP_SERVICE_PORT') || '4011',
              10,
            ),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'MAIL_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('MAIL_SERVICE_HOST') || 'localhost',
            port: parseInt(
              configService.get<string>('MAIL_SERVICE_PORT') || '4005',
              10,
            ),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('AUTH_SERVICE_HOST') || 'localhost',
            port: parseInt(
              configService.get<string>('AUTH_SERVICE_PORT') || '4003',
              10,
            ),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'IA_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('IA_SERVICE_HOST') || 'localhost',
            port: parseInt(
              configService.get<string>('IA_SERVICE_PORT') || '4004',
              10,
            ),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'TELEGRAM_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('TELEGRAM_SERVICE_HOST') || 'localhost',
            port: parseInt(
              configService.get<string>('TELEGRAM_SERVICE_PORT') || '4006',
              10,
            ),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class SharedClientsModule {}
