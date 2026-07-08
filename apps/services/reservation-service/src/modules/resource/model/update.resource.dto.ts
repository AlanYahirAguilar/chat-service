import { ApiProperty } from '@nestjs/swagger';
import { UpdateDto } from '@syncslot/shared';

export class UpdateResourceDto extends UpdateDto {
  @ApiProperty({
    description: 'Name of the resource',
    example: 'Consultorio A',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Description of the resource',
    example: 'Consultorio para medicina general',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Capacity of the resource',
    example: 1,
    required: false,
  })
  capacity?: number;

  @ApiProperty({
    description: 'Minimum hours before start time to cancel without penalty',
    example: 24,
    required: false,
  })
  cancellationWindowHours?: number;

  @ApiProperty({
    description: 'Penalty percentage if cancelled late',
    example: 50,
    required: false,
  })
  cancellationPenaltyPct?: number;
}
