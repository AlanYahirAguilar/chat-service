import { ApiProperty } from '@nestjs/swagger';

export class QRResponseDto {
  @ApiProperty({
    description: 'Código QR en formato string',
    example: '2@3r6t8y2@3r6t8y2@3r6t8y2@3r6t8y',
    nullable: true,
  })
  qrCode: string | null;

  @ApiProperty({
    description: 'Estado actual de la conexión',
    enum: ['disconnected', 'connecting', 'connected', 'qr_required'],
    example: 'qr_required',
  })
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_required';

  @ApiProperty({
    description: 'Indica si se requiere escanear el código QR',
    example: true,
  })
  qrRequired: boolean;
}
