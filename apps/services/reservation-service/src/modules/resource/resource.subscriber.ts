import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class ResourceSubscriber {
  private readonly CACHE_KEY_ALL = 'resources:all';
  private readonly CACHE_KEY_PREFIX = 'resources:id:';

  constructor(
    @Inject('REDIS_SERVICE') private readonly redisService: ClientProxy,
  ) {}

  @OnEvent('resource.created')
  async handleResourceCreated() {
    await firstValueFrom(
      this.redisService.send({ cmd: 'del' }, this.CACHE_KEY_ALL),
    );
  }

  @OnEvent('resource.updated')
  async handleResourceUpdated(payload: { id: bigint | number }) {
    await firstValueFrom(
      this.redisService.send({ cmd: 'del' }, this.CACHE_KEY_ALL),
    );
    await firstValueFrom(
      this.redisService.send(
        { cmd: 'del' },
        `${this.CACHE_KEY_PREFIX}${payload.id}`,
      ),
    );
  }

  @OnEvent('resource.deleted')
  async handleResourceDeleted(id: bigint) {
    await firstValueFrom(
      this.redisService.send({ cmd: 'del' }, this.CACHE_KEY_ALL),
    );
    await firstValueFrom(
      this.redisService.send({ cmd: 'del' }, `${this.CACHE_KEY_PREFIX}${id}`),
    );
  }
}
