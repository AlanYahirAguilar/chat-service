// @ts-nocheck
import { RpcException } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resource } from '@/modules/resource/entity/resource.entity';
import {
  Reservation,
  ReservationStatus,
} from '@/modules/reservation/entity/reservation.entity';
import { validateDateRangeLimit } from '@syncslot/shared';
import { CheckAvailabilityDto } from './model/check.availability.dto';
import { AvailabilityCalculatorService } from './availability.calculator.service';
import { CustomLoggerService } from '@syncslot/shared';
@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepo: Repository<Resource>,
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    private readonly calculator: AvailabilityCalculatorService,
    private readonly logger: CustomLoggerService,
  ) {}
  async getAvailability(query: CheckAvailabilityDto) {
    try {
      const { resourceId, startDate, endDate } = query;
      const resourceIdBigInt = BigInt(resourceId);
      this.logger.log(
        `AvailabilityService.getAvailability {"resourceId":"${resourceIdBigInt}","startDate":"${startDate}","endDate":"${endDate}"}`,
        'REQUEST',
      );
      const resource = await this.resourceRepo.findOne({
        where: { id: resourceIdBigInt },
        relations: ['schedules'],
      });
      if (!resource) {
        throw new RpcException('Resource', resourceIdBigInt);
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Limit to a max range of 31 days and verify validity
      validateDateRangeLimit(start, end, 31);
      const reservations = await this.reservationRepo
        .createQueryBuilder('res')
        .where('res.resource_id = :resourceId', {
          resourceId: resourceIdBigInt,
        })
        .andWhere('res.status != :status', {
          status: ReservationStatus.CANCELLED,
        })
        .andWhere('res.startTime < :end AND res.endTime > :start', {
          start,
          end,
        })
        .getMany();
      const availableSlots = this.calculator.calculate(
        resource.schedules,
        reservations,
        start,
        end,
      );
      return {
        resourceId: resourceIdBigInt.toString(),
        requestedPeriod: { start: start.toISOString(), end: end.toISOString() },
        availableSlots,
      };
    } catch (error) {
      this.logger.error(
        `[AvailabilityService_getAvailability] ${error.message}`,
        error.stack,
        'EXCEPTION',
      );
      throw new RpcException(error);
    }
  }
}
