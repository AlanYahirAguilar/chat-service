import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { throttlerConfig } from './config/throttler.config';
import { AuthModule } from './proxies/auth/auth.module';
import { LoggerModule } from './common/logger/logger.module';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { RedisModule } from './proxies/redis/redis.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventsModule } from './events/events.module';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { UserModule } from './proxies/user/user.module';
import { ChatProxyModule } from './proxies/chat/chat.proxy.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRootAsync(throttlerConfig),
    LoggerModule,

    AuthModule,
    RedisModule,
    EventsModule,
    UserModule,
    ChatProxyModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
