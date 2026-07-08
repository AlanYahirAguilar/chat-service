import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '@syncslot/shared';
import { Resource } from '@/modules/resource/entity/resource.entity';
//

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

@Entity('reservations')
export class Reservation extends Base {
  @ApiProperty({
    description: 'Title or short name for the reservation',
    example: 'Reunión de Diseño',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  title: string;

  @ApiProperty({
    description: 'Start time of the reservation',
    example: '2026-05-20T10:00:00Z',
  })
  @Column({ type: 'timestamp' })
  startTime: Date;

  @ApiProperty({
    description: 'End time of the reservation',
    example: '2026-05-20T11:00:00Z',
  })
  @Column({ type: 'timestamp' })
  endTime: Date;

  @ApiProperty({
    description: 'Status of the reservation',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @ManyToOne(() => Resource)
  @JoinColumn({ name: 'resource_id' })
  resource: Resource;

  @Column({ type: 'bigint', name: 'resource_id', nullable: true })
  resourceId: bigint;

  @Column({ type: 'bigint', name: 'user_id' })
  userId: bigint;

  @Column({ type: 'varchar', length: 50, nullable: true })
  recurrenceRule: string;

  @Column({ type: 'date', nullable: true })
  recurrenceEndDate: Date;

  @ManyToOne(() => Reservation, { nullable: true })
  @JoinColumn({ name: 'parent_reservation_id' })
  parentReservation: Reservation;

  @Column({ type: 'bigint', name: 'parent_reservation_id', nullable: true })
  parentReservationId: bigint;
}
