import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class UpdateDto {
  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2024-03-20T14:00:00.000Z',
    type: Date,
    required: false,
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  updatedAt?: Date;
}
