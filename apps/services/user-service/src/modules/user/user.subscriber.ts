import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class UserSubscriber {
  constructor() {}

  @OnEvent('user.*')
  handleUserUpdate(_payload: any) {
    // TODO: emit cache invalidation event to redis
  }
}
