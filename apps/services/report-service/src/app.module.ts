import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import typeOrmConfig from './config/type.orm.config';
import { PdfModule } from './modules/pdf/pdf.module';
import { ReportModule } from './modules/report/report.module';

import { LoggerModule } from '@syncslot/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    typeOrmConfig,
    PdfModule,
    ReportModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
