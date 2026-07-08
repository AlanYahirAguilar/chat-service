import { Injectable } from '@nestjs/common';
import { ProcessPaymentDto } from './model/process.payment.dto';
const { v4: uuidv4 } = require('uuid');

export interface GatewayResponse {
  success: boolean;
  transactionId: string;
}

@Injectable()
export class PaymentGatewayService {
  async charge(dto: ProcessPaymentDto): Promise<GatewayResponse> {
    // En un escenario real, aquí se llamaría a Stripe/PayPal
    const success = dto.amount > 0;
    return {
      success,
      transactionId: `txn_sim_${uuidv4()}`,
    };
  }
}
