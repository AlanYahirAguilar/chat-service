import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import typeOrmConfig from './config/type.orm.config';
import { RedisModule } from './modules/redis/redis.module';

import { LoggerModule } from '@syncslot/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    typeOrmConfig,
    RedisModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
