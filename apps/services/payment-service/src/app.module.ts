import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import typeOrmConfig from './config/type.orm.config';
import { PaymentModule } from './modules/payment/payment.module';

import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from '@syncslot/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    LoggerModule,
    typeOrmConfig,
    PaymentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
