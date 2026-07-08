import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'USER_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('USER_SERVICE_HOST') || 'localhost',
            port: parseInt(
              configService.get<string>('USER_SERVICE_PORT') || '4002',
              10,
            ),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'IAM_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('IAM_SERVICE_HOST') || 'localhost',
            port: parseInt(
              configService.get<string>('IAM_SERVICE_PORT') || '4003',
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
        name: 'REDIS_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host:
              configService.get<string>('REDIS_SERVICE_HOST') || 'localhost',
            port: parseInt(
              configService.get<string>('REDIS_SERVICE_PORT') || '4008',
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
