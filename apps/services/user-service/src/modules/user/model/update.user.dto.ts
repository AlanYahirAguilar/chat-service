import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';
import { UpdateDto } from '@chat-monorepo/shared';

export class UpdateUserDTO extends UpdateDto {
  @ApiProperty({
    description: 'Full name of the user',
    required: false,
    example: 'Ximena Flores',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Unique email of the user',
    required: false,
    example: 'ximena@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Unique phone number',
    example: '557771234567',
    required: false,
  })
  @IsPhoneNumber()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Last session date in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)',
    required: false,
    example: '2025-04-30T00:00:00.000Z',
  })
  @IsISO8601()
  @IsOptional()
  lastSessionAt?: string;

  @ApiProperty({
    description: 'User role',
    example: 'ADMIN',
    enum: ['ADMIN', 'OPERATOR', 'CLIENT', 'SUPERVISOR'],
  })
  @IsEnum(['ADMIN', 'OPERATOR', 'CLIENT', 'SUPERVISOR'])
  @IsOptional()
  role: 'ADMIN' | 'OPERATOR' | 'CLIENT' | 'SUPERVISOR';

  @ApiProperty({
    description: 'User status',
    enum: ['ACTIVE', 'INACTIVE'],
    required: false,
    example: 'ACTIVE',
  })
  @IsEnum(['ACTIVE', 'INACTIVE'])
  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE';
}
