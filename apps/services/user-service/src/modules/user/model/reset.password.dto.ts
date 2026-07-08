import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ResetPasswordDTO {
  @ApiProperty({ description: 'ID del usuario', example: 1 })
  @IsNotEmpty()
  id: bigint;

  @ApiProperty({ description: 'Nueva contraseña', example: 'Password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
