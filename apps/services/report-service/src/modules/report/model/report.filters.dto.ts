import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  IsNumber,
} from 'class-validator';

export class ReportFiltersDto {
  @ApiProperty({
    example: '2024-03',
    description: 'Month and year in format YYYY-MM',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'monthYear must be in format YYYY-MM',
  })
  monthYear: string;

  @ApiProperty({
    example: 1,
    description: 'Resource ID to filter',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  resourceId?: number;
}
