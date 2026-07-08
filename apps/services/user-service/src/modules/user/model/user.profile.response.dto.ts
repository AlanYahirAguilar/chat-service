import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty({ description: 'ID del usuario', example: '1' })
  id: string;

  @ApiProperty({ description: 'Nombre completo', example: 'Juan Perez' })
  name: string;

  @ApiProperty({
    description: 'Correo electrónico',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({ description: 'Número de teléfono', example: '557771234567' })
  phoneNumber: string;

  @ApiProperty({ description: 'Rol de usuario', example: 'CLIENT' })
  role: string;

  @ApiProperty({ description: 'Estado de la cuenta', example: 'ACTIVE' })
  status: string;

  @ApiProperty({
    description: 'Fecha de la última sesión iniciada',
    example: '2026-05-24T20:10:48.000Z',
    required: false,
    nullable: true,
  })
  lastSessionAt: Date | null;

  @ApiProperty({
    description: 'Fecha de creación del usuario',
    example: '2026-05-15T07:38:26.000Z',
    nullable: true,
  })
  createdAt: Date | null;

  @ApiProperty({
    description: 'Lista de códigos de privilegios del usuario',
    example: ['reservations:create', 'resources:read'],
  })
  privileges: string[];
}
