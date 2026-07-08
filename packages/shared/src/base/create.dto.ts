import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class CreateDto {
  @ApiProperty({
    description: 'Fecha de creación',
    example: '2024-03-20T14:00:00.000Z',
    type: Date,
    required: false,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  createdAt?: Date;
}
