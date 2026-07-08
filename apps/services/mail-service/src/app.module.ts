import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import typeOrmConfig from './config/type.orm.config';
import { MailModule } from './modules/mail/mail.module';

import { LoggerModule } from '@syncslot/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    typeOrmConfig,
    MailModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
