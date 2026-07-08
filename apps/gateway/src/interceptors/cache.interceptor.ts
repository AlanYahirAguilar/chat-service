import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '@/proxies/redis/redis.service';
import { CACHE_KEY_METADATA } from '@/common/cache/decorators/cache-key.decorator';
import { CACHE_TTL_METADATA } from '@/common/cache/decorators/cache-ttl.decorator';
import { CustomLoggerService } from '@/common/logger/logger.service';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
    private readonly logger: CustomLoggerService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const cacheKeyMetadata = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    if (!cacheKeyMetadata) {
      return next.handle();
    }

    const ttlMetadata = this.reflector.get<number>(
      CACHE_TTL_METADATA,
      context.getHandler(),
    );
    const ttl = ttlMetadata || 3600;

    const request = context.switchToHttp().getRequest();

    let cacheKey = cacheKeyMetadata;
    const sources = [request.params, request.query];

    for (const source of sources) {
      if (source) {
        for (const [key, value] of Object.entries(source)) {
          if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'bigint'
          ) {
            cacheKey = cacheKey.replace(`:${key}`, String(value));
          }
        }
      }
    }

    const cachedResponse = await this.redisService.get(cacheKey);

    if (cachedResponse) {
      this.logger.log(`Hit for key: ${cacheKey}`, 'CACHE');
      return of(cachedResponse);
    }

    this.logger.log(`Miss for key: ${cacheKey}`, 'CACHE');

    return next.handle().pipe(
      tap(async (response) => {
        await this.redisService.set({
          key: cacheKey,
          value: response,
          ttl: ttl,
        });
      }),
    );
  }
}
