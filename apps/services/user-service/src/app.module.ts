import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import typeOrmConfig from './config/type.orm.config';
import { UserModule } from './modules/user/user.module';
import { SharedClientsModule } from './common/shared.clients.module';

import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from '@syncslot/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    LoggerModule,
    typeOrmConfig,
    SharedClientsModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
