import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Número de teléfono del destinatario',
    example: '5217771235678',
    required: true,
  })
  phone: string;

  @ApiProperty({
    description: 'Mensaje a enviar',
    example: 'Hola, este es un mensaje de prueba',
    required: true,
  })
  message: string;
}

export class SendBulkMessageDto {
  @ApiProperty({
    description: 'Lista de números de teléfono de los destinatarios',
    example: ['5217771235678', '5217771235679'],
    type: [String],
    required: true,
  })
  phones: string[];

  @ApiProperty({
    description: 'Mensaje a enviar a todos los destinatarios',
    example: 'Hola, este es un mensaje masivo de prueba',
    required: true,
  })
  message: string;
}

export interface MessageResult {
  phone: string;
  success: boolean;
}

export interface MessageError {
  phone: string;
  error: string;
}

export interface BulkMessageResponse {
  success: boolean;
  total: number;
  successCount: number;
  errorCount: number;
  results: MessageResult[];
  errors: MessageError[];
  error?: string;
}
