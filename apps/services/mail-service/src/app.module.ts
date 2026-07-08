import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import typeOrmConfig from './config/type.orm.config';
import { MailModule } from './modules/mail/mail.module';

import { LoggerModule } from '@chat-monorepo/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../../.env' }),
    LoggerModule,
    typeOrmConfig,
    MailModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
