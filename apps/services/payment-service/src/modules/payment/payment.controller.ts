import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentService } from './payment.service';
import { ProcessPaymentDto } from './model/process.payment.dto';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern({ cmd: 'processPayment' })
  async processPayment(
    @Payload() data: { dto: ProcessPaymentDto; userId: bigint },
  ) {
    const result = await this.paymentService.processPayment(data.userId, data.dto);
    return {
      ...result,
      id: result.id?.toString(),
      reservationId: result.reservationId?.toString(),
    };
  }
}
