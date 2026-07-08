import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RedisService } from '@/proxies/redis/redis.service';
import { CustomLoggerService } from '@/common/logger/logger.service';

@Injectable()
export class CacheInvalidationSubscriber {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: CustomLoggerService,
  ) {}

  @OnEvent('cache.invalidate')
  async handleCacheInvalidationEvent(keyPattern: string) {
    this.logger.log(`Invalidating key: ${keyPattern}`, 'CACHE');
    await this.redisService.del(keyPattern);
  }
}
