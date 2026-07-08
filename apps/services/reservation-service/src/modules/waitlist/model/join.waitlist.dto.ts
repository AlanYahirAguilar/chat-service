import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class JoinWaitlistDto {
  @ApiProperty({ description: 'ID of the resource to wait for', example: 1 })
  @IsNumber()
  @IsPositive()
  resourceId: bigint;

  @ApiProperty({ description: 'Requested start time in ISO format', example: '2026-05-20T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  requestedStartTime: string;

  @ApiProperty({ description: 'Requested end time in ISO format', example: '2026-05-20T11:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  requestedEndTime: string;
}
