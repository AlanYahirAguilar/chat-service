import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '@syncslot/shared';

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity('payments')
export class Payment extends Base {
  @ApiProperty({
    description: 'Transaction ID from payment gateway',
    example: 'txn_1234567890',
  })
  @Column({ unique: true })
  transactionId: string;

  @ApiProperty({ description: 'Amount paid', example: 500.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({
    description: 'Status of the payment',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @ApiProperty({ description: 'Payment method used', example: 'CREDIT_CARD' })
  @Column()
  paymentMethod: string;

  @ApiProperty({
    description: 'Reservation associated with this payment',
    type: Number,
  })
  @JoinColumn({ name: 'reservation_id' })
  @Column({ type: 'bigint', name: 'reservation_id' })
  reservationId: bigint;
}
