import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ProcessPaymentDto {
  @ApiProperty({ example: 1, description: 'ID of the reservation to pay for' })
  @IsNotEmpty()
  @IsNumber()
  reservationId: number;

  @ApiProperty({ example: 500.0, description: 'Amount to be paid' })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'CREDIT_CARD', description: 'Payment method used' })
  @IsNotEmpty()
  @IsString()
  paymentMethod: string;
}
