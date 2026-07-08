import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import typeOrmConfig from './config/type.orm.config';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';

import { LoggerModule } from '@chat-monorepo/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../../.env' }),
    LoggerModule,
    typeOrmConfig,
    WhatsappModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
