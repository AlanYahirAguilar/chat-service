import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumberString } from 'class-validator';

export class CheckAvailabilityDto {
  @ApiProperty({ description: 'ID of the resource to check', example: '1' })
  @IsNumberString()
  @IsNotEmpty()
  resourceId: string;

  @ApiProperty({
    description: 'Start date in ISO 8601 format',
    example: '2026-05-20T00:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'End date in ISO 8601 format',
    example: '2026-05-27T00:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}
