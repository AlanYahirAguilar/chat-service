import { ClientsModule, Transport } from '@nestjs/microservices';
import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { PdfModule } from '../pdf/pdf.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PdfModule,
    ClientsModule.registerAsync([
      {
        name: 'STORAGE_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('STORAGE_SERVICE_HOST') || 'localhost',
            port: parseInt(configService.get<string>('STORAGE_SERVICE_PORT') || '4006', 10),
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
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
