import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateRedisDto {
  @ApiProperty({
    description: 'The key to store in Redis',
    example: 'user:1:session',
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: 'The value to store in Redis',
    example: { userId: 1, active: true },
  })
  @IsNotEmpty()
  value: any;

  @ApiProperty({
    description: 'Time to live in seconds',
    required: false,
    example: 3600,
  })
  @IsOptional()
  @IsNumber()
  ttl?: number;
}
