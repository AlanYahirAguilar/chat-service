// @ts-nocheck
import { RpcException } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Reservation, ReservationStatus } from './entity/reservation.entity';
import { Resource } from '@/modules/resource/entity/resource.entity';
import { CreateReservationDto } from './model/create.reservation.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Logger } from '@nestjs/common';

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);
  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    @Inject('USER_SERVICE') private readonly userService: ClientProxy,
    @Inject('IAM_SERVICE') private readonly iamService: ClientProxy,
  ) {}

  async create(
    userId: bigint,
    dto: CreateReservationDto,
  ): Promise<Reservation> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      this.logger.log(
        `ReservationService.create: ${JSON.stringify({ userId, ...dto })}`,
        'REQUEST',
      );

      const start = new Date(dto.startTime);
      const end = new Date(dto.endTime);

      // Validate date range limit to prevent DoS
      this.validateDateRangeLimit(start, end, 31);

      const resource = await queryRunner.manager.findOne(Resource, {
        where: { id: dto.resourceId },
        relations: ['schedules'],
      });

      if (!resource) {
        throw new RpcException('Resource', dto.resourceId);
      }

      if (!this.isWithinSchedule(start, end, resource)) {
        throw new BadRequestException(
          'Requested slot is outside the resource open hours.',
        );
      }

      await this.checkOverlappingReservations(
        queryRunner.manager,
        BigInt(dto.resourceId),
        start,
        end,
      );

      const reservation = queryRunner.manager.create(Reservation, {
        resourceId: BigInt(dto.resourceId),
        userId: BigInt(userId),
        startTime: start,
        endTime: end,
        status: ReservationStatus.PENDING,
      });

      const savedReservation = await queryRunner.manager.save(reservation);

      if (dto.recurrenceRule && dto.recurrenceEndDate) {
        const occurrences = this.generateOccurrences(
          savedReservation,
          dto.recurrenceRule,
          new Date(dto.recurrenceEndDate),
        );
        for (const occurrence of occurrences) {
          await this.checkOverlappingReservations(
            queryRunner.manager,
            BigInt(dto.resourceId),
            occurrence.startTime,
            occurrence.endTime,
          );
          const child = queryRunner.manager.create(Reservation, {
            ...occurrence,
            parentReservationId: savedReservation.id,
            status: ReservationStatus.PENDING,
          });
          await queryRunner.manager.save(child);
        }
      }

      await queryRunner.commitTransaction();

      // Emit event for Mailer/Notifications
      this.eventEmitter.emit('reservation.created', savedReservation);

      return savedReservation;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const err = error as Error;
      this.logger.error(
        `[ReservationService_create] ${err.message}`,
        err.stack,
        'EXCEPTION',
      );
      throw new RpcException(error);
    } finally {
      await queryRunner.release();
    }
  }

  async cancel(reservationId: bigint, userId: bigint): Promise<Reservation> {
    try {
      this.logger.log(
        `ReservationService.cancel: ${JSON.stringify({ reservationId, userId })}`,
        'REQUEST',
      );

      const reservation = await this.reservationRepo.findOne({
        where: { id: reservationId },
        relations: ['resource'],
      });

      if (!reservation) {
        throw new RpcException('Reservation', reservationId);
      }

      if (BigInt(reservation.userId) !== BigInt(userId)) {
        const currentUser = await firstValueFrom<{ role?: string }>(
          this.userService.send({ cmd: 'find_user_by_id' }, userId.toString()),
        );
        const role = currentUser?.role || 'CLIENT';
        const userPrivileges = await firstValueFrom<string[]>(
          this.iamService.send({ cmd: 'getRolePrivileges' }, [role]),
        );

        if (!userPrivileges || !userPrivileges.includes('reservations:delete_others')) {
          throw new ForbiddenException(
            'No tienes permisos dinámicos para cancelar una reserva que no es tuya.',
          );
        }
      }

      if (reservation.status === ReservationStatus.CANCELLED) {
        throw new BadRequestException('Reservation is already cancelled.');
      }

      const now = new Date();
      const hoursUntilStart = (reservation.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (
        reservation.resource &&
        hoursUntilStart < reservation.resource.cancellationWindowHours &&
        reservation.resource.cancellationPenaltyPct > 0
      ) {
        this.eventEmitter.emit('reservation.cancelled.with.penalty', {
          reservation,
          penaltyPct: reservation.resource.cancellationPenaltyPct,
        });
      }

      reservation.status = ReservationStatus.CANCELLED;
      const updated = await this.reservationRepo.save(reservation);

      // Emit event for notification or processing
      this.eventEmitter.emit('reservation.cancelled', updated);

      return updated;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `[ReservationService_cancel] ${err.message}`,
        err.stack,
        'EXCEPTION',
      );
      throw new RpcException(error);
    }
  }

  async confirmPayment(reservationId: bigint): Promise<Reservation> {
    try {
      this.logger.log(
        `ReservationService.confirmPayment: ${reservationId}`,
        'REQUEST',
      );
      const reservation = await this.reservationRepo.findOne({
        where: { id: reservationId },
        relations: ['resource'],
      });

      if (!reservation) {
        throw new RpcException(
          `Reservation with ID ${reservationId} not found`,
        );
      }

      this.eventEmitter.emit('payment.success', { reservation });

      return reservation;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `[ReservationService_confirmPayment] ${err.message}`,
        err.stack,
        'EXCEPTION',
      );
      throw new RpcException(error);
    }
  }

  async getReportData(filters: {
    startDate: string;
    endDate: string;
    resourceId?: number;
  }) {
    try {
      this.logger.log(
        `ReservationService.getReportData: ${JSON.stringify(filters)}`,
        'REQUEST',
      );
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);

      const query = this.reservationRepo
        .createQueryBuilder('reservation')
        .leftJoinAndSelect('reservation.resource', 'resource')
        .where(
          'reservation.startTime >= :start AND reservation.endTime <= :end',
          { start, end },
        );

      if (filters.resourceId) {
        query.andWhere('reservation.resource_id = :resourceId', {
          resourceId: filters.resourceId,
        });
      }

      const reservations = await query.getMany();

      let resources: Resource[] = [];
      if (filters.resourceId) {
        const resource = await this.dataSource
          .getRepository(Resource)
          .findOne({ where: { id: BigInt(filters.resourceId) } });
        if (resource) resources = [resource];
      } else {
        resources = await this.dataSource.getRepository(Resource).find();
      }

      return {
        reservations: reservations.map((r) => ({
          id: r.id.toString(),
          startTime: r.startTime.toISOString(),
          endTime: r.endTime.toISOString(),
          status: r.status,
          resourceId: r.resource?.id.toString(),
          userId: r.userId.toString(),
        })),
        resources: resources.map((res) => ({
          id: res.id.toString(),
          name: res.name,
        })),
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `[ReservationService_getReportData] ${err.message}`,
        err.stack,
        'EXCEPTION',
      );
      throw new RpcException(error);
    }
  }
  
  private validateDateRangeLimit(start: Date, end: Date, maxDays: number) {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > maxDays) {
      throw new RpcException({
        status: 400,
        message: `El rango de fechas no puede exceder los ${maxDays} días.`,
      });
    }
  }

  private generateOccurrences(
    base: Reservation,
    rule: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    endDate: Date,
  ): Partial<Reservation>[] {
    const occurrences = [];
    const duration = base.endTime.getTime() - base.startTime.getTime();
    let current = new Date(base.startTime);

    if (rule === 'DAILY') current.setDate(current.getDate() + 1);
    else if (rule === 'WEEKLY') current.setDate(current.getDate() + 7);
    else current.setMonth(current.getMonth() + 1);

    while (current <= endDate) {
      const start = new Date(current);
      const end = new Date(current.getTime() + duration);
      occurrences.push({
        resourceId: base.resourceId,
        userId: base.userId,
        title: base.title,
        startTime: start,
        endTime: end,
      });

      if (rule === 'DAILY') current.setDate(current.getDate() + 1);
      else if (rule === 'WEEKLY') current.setDate(current.getDate() + 7);
      else current.setMonth(current.getMonth() + 1);
    }
    return occurrences;
  }

  private parseTimeString(timeString: string) {
    const [hour, minute] = timeString.split(':').map(Number);
    return { hour, minute };
  }

  private isWithinSchedule(
    start: Date,
    end: Date,
    resource: Resource,
  ): boolean {
    const dayOfWeekIndex = start.getUTCDay();
    const dailySchedules = resource.schedules.filter(
      (s) => s.dayOfWeek === dayOfWeekIndex,
    );

    for (const schedule of dailySchedules) {
      const { hour: startHour, minute: startMin } = this.parseTimeString(
        schedule.startTime,
      );
      const { hour: endHour, minute: endMin } = this.parseTimeString(
        schedule.endTime,
      );

      const scheduleStart = new Date(start);
      scheduleStart.setUTCHours(startHour, startMin, 0, 0);

      const scheduleEnd = new Date(start);
      scheduleEnd.setUTCHours(endHour, endMin, 0, 0);

      if (start >= scheduleStart && end <= scheduleEnd) {
        return true;
      }
    }
    return false;
  }

  private async checkOverlappingReservations(
    manager: any,
    resourceId: bigint,
    start: Date,
    end: Date,
  ): Promise<void> {
    const overlappingReservations = await manager
      .createQueryBuilder(Reservation, 'reservation')
      .setLock('pessimistic_write')
      .where('reservation.resource_id = :resourceId', { resourceId })
      .andWhere('reservation.status != :cancelledStatus', {
        cancelledStatus: ReservationStatus.CANCELLED,
      })
      .andWhere(
        '(reservation.startTime < :end AND reservation.endTime > :start)',
        { start, end },
      )
      .getMany();

    if (overlappingReservations.length > 0) {
      throw new RpcException({
        status: 400,
        message: 'The resource is already reserved for the requested time frame.',
      });
    }
  }
}
