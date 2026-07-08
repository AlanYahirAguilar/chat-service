import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Payment, PaymentStatus } from './entity/payment.entity';
import { ProcessPaymentDto } from './model/process.payment.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RpcException, ClientProxy } from '@nestjs/microservices';
import { PaymentGatewayService } from './payment.gateway.service';
import { firstValueFrom } from 'rxjs';

enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly gateway: PaymentGatewayService,
    @Inject('RESERVATION_SERVICE')
    private readonly reservationService: ClientProxy,
  ) {}

  async processPayment(
    userId: bigint,
    dto: ProcessPaymentDto,
  ): Promise<Payment> {
    try {
      this.logger.log(
        `PaymentService.processPayment: userId=${userId} DTO=${JSON.stringify(dto)}`,
        'REQUEST',
      );

      // 1. Validaciones previas
      const reservationRows = await this.dataSource.query(
        'SELECT id, status, user_id FROM reservations WHERE id = ? AND deleted_at IS NULL',
        [BigInt(dto.reservationId)],
      );
      const reservation = reservationRows[0];

      if (!reservation) {
        throw new BadRequestException('Reservation not found.');
      }

      // Authorization is enforced at the gateway level (payments:create privilege).
      // Any user reaching this point is allowed to process payments by role.

      if (reservation.status !== ReservationStatus.PENDING) {
        throw new BadRequestException('Reservation is not pending payment.');
      }

      const chargeResult = await this.gateway.charge(dto);

      return await this.persistPaymentResult(
        dto.reservationId,
        dto,
        chargeResult,
      );
    } catch (error) {
      this.logger.error(
        `[PaymentService_processPayment] ${error.message}`,
        error.stack,
        'EXCEPTION',
      );
      throw new RpcException({
        status: (error as any).status || 400,
        message: error.message,
      });
    }
  }

  private async persistPaymentResult(
    reservationId: bigint | number,
    dto: ProcessPaymentDto,
    charge: { success: boolean; transactionId: string },
  ): Promise<Payment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction('SERIALIZABLE');

    try {
      const lockedReservationRows = await queryRunner.query(
        'SELECT id as res_id, status as res_status FROM reservations WHERE id = ? FOR UPDATE',
        [BigInt(reservationId)],
      );
      const lockedReservation = lockedReservationRows[0];

      if (!lockedReservation) {
        throw new BadRequestException('Reservation not found during locking.');
      }

      if (lockedReservation.res_status !== ReservationStatus.PENDING) {
        throw new BadRequestException(
          'Reservation state was modified during payment process.',
        );
      }

      const payment = this.paymentRepo.create({
        amount: dto.amount,
        paymentMethod: dto.paymentMethod,
        transactionId: charge.transactionId,
        status: PaymentStatus.COMPLETED,
        reservationId: BigInt(reservationId),
      });
      const savedPayment = await queryRunner.manager.save(payment);

      await queryRunner.query(
        'UPDATE reservations SET status = ? WHERE id = ?',
        [ReservationStatus.CONFIRMED, BigInt(reservationId)],
      );

      await queryRunner.commitTransaction();

      // Emitir eventos post-commit
      const eventName = charge.success ? 'payment.success' : 'payment.failed';
      this.eventEmitter.emit(eventName, {
        reservation: lockedReservation,
        payment: savedPayment,
      });

      if (charge.success) {
        try {
          await firstValueFrom(
            this.reservationService.send(
              { cmd: 'confirmPayment' },
              { reservationId: BigInt(reservationId) },
            ),
          );
        } catch (err) {
          this.logger.error(
            `Failed to notify reservation service of payment success: ${err.message}`,
          );
        }
      }

      return savedPayment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
