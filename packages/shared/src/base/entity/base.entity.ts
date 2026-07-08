import { Column, DeleteDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export abstract class Base {
  @ApiProperty({
    description: 'ID único del registro',
    example: 1,
    type: Number,
  })
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: bigint;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-03-20T14:00:00.000Z',
    type: Date,
    required: false,
  })
  @Column('timestamp', {
    name: 'created_at',
    nullable: true,
    comment: 'Fecha de creación',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date | null;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-03-20T14:00:00.000Z',
    type: Date,
    required: false,
  })
  @Column('timestamp', {
    name: 'updated_at',
    nullable: true,
    comment: 'Fecha de última actualización',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date | null;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp',
    nullable: true,
    comment: 'Logical deletion date',
  })
  @ApiProperty({ example: null })
  deletedAt: Date | null;
}
