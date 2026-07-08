import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { Redis } from 'ioredis';
import { redisConfig } from '@/config/redis.config';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      ...redisConfig,
      useFactory: (configService) =>
        new Redis(redisConfig.useFactory(configService)),
    },
    RedisService,
  ],
  exports: [RedisService, 'REDIS_CLIENT'],
})
export class RedisModule {}
