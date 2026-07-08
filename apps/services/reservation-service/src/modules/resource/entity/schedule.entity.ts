import { Entity, Column, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '@syncslot/shared';
import { Resource } from './resource.entity';

@Entity('schedules')
export class Schedule extends Base {
  @ApiProperty({
    description: 'Day of the week (0 = Sunday, 1 = Monday, etc.)',
    example: 1,
  })
  @Column()
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.

  @ApiProperty({ description: 'Start time in HH:mm format', example: '09:00' })
  @Column({ type: 'time' })
  startTime: string;

  @ApiProperty({ description: 'End time in HH:mm format', example: '17:00' })
  @Column({ type: 'time' })
  endTime: string;

  @ApiProperty({
    description: 'Resource associated with this schedule',
    type: () => Resource,
  })
  @ManyToOne(() => Resource, (resource) => resource.schedules, {
    onDelete: 'CASCADE',
  })
  resource: Relation<Resource>;
}
