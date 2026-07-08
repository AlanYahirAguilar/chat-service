import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { Logger } from '@nestjs/common';
import { Reservation } from './entity/reservation.entity';
import { WaitlistEntry } from '../waitlist/entity/waitlist.entity';
import { sendReservationNotificationMessage } from './templates/reservation.email.templates';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ReservationSubscriber {
  private readonly logger = new Logger(ReservationSubscriber.name);
  constructor(
    @Inject('MAIL_SERVICE') private readonly mailService: ClientProxy,
    @Inject('USER_SERVICE') private readonly userService: ClientProxy,
    @InjectRepository(WaitlistEntry) private readonly waitlistRepo: Repository<WaitlistEntry>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('reservation.created')
  async handleReservationCreated(reservation: Reservation) {
    this.logger.log(
      `Received event for created reservation ID: ${reservation.id}`,
      'EMAIL',
    );

    try {
      if (reservation.userId) {
        const user = await firstValueFrom<{ email?: string }>(
          this.userService.send({ cmd: 'find_user_by_id' }, reservation.userId.toString()),
        );

        if (user && user.email) {
          const date = new Date(reservation.startTime).toLocaleString('es-MX');
          const html = sendReservationNotificationMessage(
            `Tu reserva ha sido pre-creada para el inicio: ${date}. Tienes 15 minutos para realizar tu pago y confirmarla.`,
          );
          await firstValueFrom(
            this.mailService.send(
              { cmd: 'sendMail' },
              {
                to: user.email,
                subject: 'Reserva Pendiente de Pago - SyncSlot',
                html,
              },
            ),
          );
        }
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `[ReservationSubscriber_handleReservationCreated] ${err.message}`,
        err.stack,
        'EXCEPTION',
      );
    }
  }

  @OnEvent('payment.success')
  async handlePaymentSuccess(payload: { reservation: Reservation }) {
    const { reservation } = payload;
    this.logger.log(
      `Received event for successful payment, reservation ID: ${reservation.id}`,
      'EMAIL',
    );

    try {
      if (reservation.userId) {
        const user = await firstValueFrom<{ email?: string }>(
          this.userService.send({ cmd: 'find_user_by_id' }, reservation.userId.toString()),
        );

        if (user && user.email) {
          const date = new Date(reservation.startTime).toLocaleString('es-MX');
          const html = sendReservationNotificationMessage(
            `¡Tu pago ha sido procesado con éxito! Tu reserva ha sido confirmada para el inicio: ${date}.`,
          );
          await firstValueFrom(
            this.mailService.send(
              { cmd: 'sendMail' },
              {
                to: user.email,
                subject: 'Confirmación de Reserva - SyncSlot',
                html,
              },
            ),
          );
        }
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `[ReservationSubscriber_handlePaymentSuccess] ${err.message}`,
        err.stack,
        'EXCEPTION',
      );
    }
  }

  @OnEvent('reservation.cancelled')
  async handleReservationCancelled(reservation: Reservation) {
    this.logger.log(
      `Received event for cancelled reservation ID: ${reservation.id}, checking waitlist`,
      'WAITLIST',
    );

    try {
      const nextInLine = await this.waitlistRepo.findOne({
        where: {
          resourceId: reservation.resourceId,
          requestedStartTime: LessThanOrEqual(reservation.startTime),
          requestedEndTime: MoreThanOrEqual(reservation.endTime),
          status: 'WAITING',
        },
        order: { createdAt: 'ASC' }, // FIFO
      });

      if (nextInLine) {
        nextInLine.status = 'NOTIFIED';
        nextInLine.notifiedAt = new Date();
        await this.waitlistRepo.save(nextInLine);
        this.eventEmitter.emit('waitlist.notified', nextInLine);

        // mailService sends notification
        const user = await firstValueFrom<{ email?: string }>(
          this.userService.send({ cmd: 'find_user_by_id' }, nextInLine.userId.toString()),
        );

        if (user && user.email) {
          const html = sendReservationNotificationMessage(
            `¡Un espacio se ha liberado en el recurso que esperabas! Tienes 15 minutos para realizar tu reserva.`,
          );
          await firstValueFrom(
            this.mailService.send(
              { cmd: 'sendMail' },
              {
                to: user.email,
                subject: '¡Slot Disponible en Lista de Espera! - SyncSlot',
                html,
              },
            ),
          );
        }
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `[ReservationSubscriber_handleReservationCancelled] ${err.message}`,
        err.stack,
        'EXCEPTION',
      );
    }
  }
}
