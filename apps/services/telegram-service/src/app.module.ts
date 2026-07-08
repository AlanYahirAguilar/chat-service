import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import typeOrmConfig from './config/type.orm.config';
import { TelegramModule } from './modules/telegram/telegram.module';

import { LoggerModule } from '@chat-monorepo/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../../.env' }),
    LoggerModule,
    typeOrmConfig,
    TelegramModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
