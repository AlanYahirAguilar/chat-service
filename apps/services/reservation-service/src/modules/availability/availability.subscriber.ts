import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from '@/modules/reservation/entity/reservation.entity';

@Injectable()
export class AvailabilitySubscriber {
  private readonly logger = new Logger(AvailabilitySubscriber.name);
  constructor(
    @Inject('REDIS_SERVICE') private readonly redisService: ClientProxy,
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
  ) {}

  private async invalidateAvailability(resourceId: bigint | number) {
    const pattern = `availability:resource_id:${resourceId}:*`;
    this.logger.log(
      `Invalidating availability cache for resource: ${resourceId} using pattern: ${pattern}`,
      'CACHE',
    );
    await firstValueFrom(
      this.redisService.send({ cmd: 'delPattern' }, { pattern }),
    );
  }

  @OnEvent('reservation.created')
  async handleReservationCreated(reservation: Reservation) {
    const resId = reservation.resource?.id;
    if (resId) {
      await this.invalidateAvailability(resId);
    } else {
      const dbRes = await this.reservationRepo.findOne({
        where: { id: reservation.id },
        relations: ['resource'],
      });
      if (dbRes?.resource?.id) {
        await this.invalidateAvailability(dbRes.resource.id);
      }
    }
  }

  @OnEvent('reservation.cancelled')
  async handleReservationCancelled(reservation: Reservation) {
    const resId = reservation.resource?.id;
    if (resId) {
      await this.invalidateAvailability(resId);
    } else {
      const dbRes = await this.reservationRepo.findOne({
        where: { id: reservation.id },
        relations: ['resource'],
      });
      if (dbRes?.resource?.id) {
        await this.invalidateAvailability(dbRes.resource.id);
      }
    }
  }

  @OnEvent('payment.success')
  async handlePaymentSuccess(payload: { reservation: Reservation }) {
    const { reservation } = payload;
    const resId = reservation.resource?.id;
    if (resId) {
      await this.invalidateAvailability(resId);
    } else {
      const dbRes = await this.reservationRepo.findOne({
        where: { id: reservation.id },
        relations: ['resource'],
      });
      if (dbRes?.resource?.id) {
        await this.invalidateAvailability(dbRes.resource.id);
      }
    }
  }

  @OnEvent('resource.updated')
  async handleResourceUpdated(resource: any) {
    if (resource?.id) {
      await this.invalidateAvailability(resource.id);
    }
  }

  @OnEvent('resource.deleted')
  async handleResourceDeleted(id: bigint | number) {
    await this.invalidateAvailability(id);
  }
}
