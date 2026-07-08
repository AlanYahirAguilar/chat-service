import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './model/create.reservation.dto';

@Controller()
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @MessagePattern({ cmd: 'createReservation' })
  async create(@Payload() data: { dto: CreateReservationDto; userId: bigint }) {
    const result = await this.reservationService.create(data.userId, data.dto);
    return this.serializeReservation(result);
  }

  @MessagePattern({ cmd: 'cancelReservation' })
  async cancel(@Payload() data: { id: bigint; userId: bigint }) {
    const result = await this.reservationService.cancel(data.id, data.userId);
    return this.serializeReservation(result);
  }

  @MessagePattern({ cmd: 'confirmPayment' })
  async confirmPayment(@Payload() data: { reservationId: bigint }) {
    const result = await this.reservationService.confirmPayment(data.reservationId);
    return this.serializeReservation(result);
  }

  @MessagePattern({ cmd: 'getReportData' })
  getReportData(
    @Payload()
    filters: {
      startDate: string;
      endDate: string;
      resourceId?: number;
    },
  ) {
    return this.reservationService.getReportData(filters);
  }

  private serializeReservation(reservation: any) {
    if (!reservation) return null;
    return {
      ...reservation,
      id: reservation.id?.toString(),
      userId: reservation.userId?.toString(),
      resourceId: reservation.resourceId?.toString(),
      resource: reservation.resource ? {
        ...reservation.resource,
        id: reservation.resource.id?.toString(),
      } : undefined,
    };
  }
}
