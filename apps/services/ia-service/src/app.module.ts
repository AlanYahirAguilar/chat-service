import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import typeOrmConfig from './config/type.orm.config';
import { IaModule } from './modules/ia/ia.module';

import { LoggerModule } from '@chat-monorepo/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../../.env' }),
    LoggerModule,
    typeOrmConfig,
    IaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
