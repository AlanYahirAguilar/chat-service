import { ApiProperty } from '@nestjs/swagger';

// Redis typically operates in-memory and does not require a traditional TypeORM entity.
// This file is kept to satisfy the strict nestjs-architect module folder structure.
export class RedisEntity {
  @ApiProperty({ description: 'The key stored in Redis', example: 'string' })
  key: string;

  @ApiProperty({ description: 'The value stored in Redis', example: 'any' })
  value: any;

  @ApiProperty({
    description: 'Time to live in seconds',
    required: false,
    example: 3600,
  })
  ttl?: number;
}
