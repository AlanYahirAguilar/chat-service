import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { CreateDto } from '@chat-monorepo/shared';

export class CreateUserDTO extends CreateDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'Ximena Flores',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Unique email of the user',
    example: 'ximena@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Unique phone number', example: '557771234567' })
  @IsPhoneNumber()
  phoneNumber: string;

  @ApiProperty({ description: 'Encrypted password', example: 'Password123' })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'Last session date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)',
    required: false,
    example: '2024-04-30T00:00:00.000Z',
  })
  @IsISO8601()
  @IsOptional()
  lastSessionAt?: string;

  @ApiProperty({
    description: 'User role',
    example: 'CLIENT',
    enum: ['ADMIN', 'OPERATOR', 'CLIENT', 'SUPERVISOR'],
  })
  @IsEnum(['ADMIN', 'OPERATOR', 'CLIENT', 'SUPERVISOR'])
  role: 'ADMIN' | 'OPERATOR' | 'CLIENT' | 'SUPERVISOR';

  @ApiProperty({
    description: 'User status',
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
    example: 'ACTIVE',
  })
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
}
