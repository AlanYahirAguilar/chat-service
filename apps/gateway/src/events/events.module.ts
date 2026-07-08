import { Module } from '@nestjs/common';
import { CacheInvalidationSubscriber } from './cache-invalidation.subscriber';

@Module({
  providers: [CacheInvalidationSubscriber],
})
export class EventsModule {}
