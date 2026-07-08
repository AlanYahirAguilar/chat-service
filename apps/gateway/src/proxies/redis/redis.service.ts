import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CreateRedisDto } from './model/create.redis.dto';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  async set(createRedisDto: CreateRedisDto): Promise<void> {
    const { key, value, ttl } = createRedisDto;
    if (ttl) {
      await this.redisClient.set(key, JSON.stringify(value), 'EX', ttl);
    } else {
      await this.redisClient.set(key, JSON.stringify(value));
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.redisClient.keys(pattern);
    if (keys && keys.length > 0) {
      await this.redisClient.del(...keys);
    }
  }
}
