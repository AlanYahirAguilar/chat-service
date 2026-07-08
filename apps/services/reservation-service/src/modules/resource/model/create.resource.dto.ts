import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateDto } from '@syncslot/shared';

export class ScheduleDto {
  @ApiProperty({
    description: 'Day of the week (0 = Sunday, 1 = Monday, etc.)',
    example: 1,
  })
  @IsNumber()
  @Min(0)
  dayOfWeek: number;

  @ApiProperty({ description: 'Start time in HH:mm format', example: '09:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: 'End time in HH:mm format', example: '17:00' })
  @IsString()
  @IsNotEmpty()
  endTime: string;
}

export class CreateResourceDto extends CreateDto {
  @ApiProperty({
    description: 'Name of the resource',
    example: 'Consultorio A',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the resource',
    example: 'Consultorio para medicina general',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Capacity of the resource',
    example: 1,
    required: false,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiProperty({
    description: 'Schedules for the resource',
    type: [ScheduleDto],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleDto)
  @IsOptional()
  schedules?: ScheduleDto[];
}
