import { Entity, Column, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '@syncslot/shared';
import { Schedule } from './schedule.entity';

@Entity('resources')
export class Resource extends Base {
  @ApiProperty({
    description: 'Name of the resource',
    example: 'Consultorio A',
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'Description of the resource',
    example: 'Consultorio para medicina general',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Capacity of the resource',
    example: 1,
    default: 1,
  })
  @Column({ default: 1 })
  capacity: number;

  @ApiProperty({
    description: 'Schedules associated with the resource',
    type: () => [Schedule],
  })
  @OneToMany(() => Schedule, (schedule) => schedule.resource, { cascade: true })
  schedules: Relation<Schedule>[];

  @Column({ default: 24 })
  cancellationWindowHours: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  cancellationPenaltyPct: number;
}
