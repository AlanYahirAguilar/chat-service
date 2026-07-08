import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ResetPasswordCodeDTO {
  @ApiProperty({ description: 'User email' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Verification code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'New password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
