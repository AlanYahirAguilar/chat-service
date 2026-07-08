import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { CreateDto } from '@syncslot/shared';

export class CreateReservationDto extends CreateDto {
  @ApiProperty({ description: 'ID of the resource to reserve', example: 1 })
  @IsNumber()
  @IsPositive()
  resourceId: bigint;

  @ApiProperty({
    description: 'Title or short name for the reservation',
    example: 'Junta mensual',
    required: false,
  })
  title?: string;

  @ApiProperty({
    description: 'Start time in ISO format',
    example: '2026-05-20T10:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: 'End time in ISO format',
    example: '2026-05-20T11:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({
    description: 'Rule for recurring reservations',
    enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
    required: false,
  })
  recurrenceRule?: 'DAILY' | 'WEEKLY' | 'MONTHLY';

  @ApiProperty({
    description: 'End date for the recurrence',
    example: '2026-12-31',
    required: false,
  })
  recurrenceEndDate?: string;
}
