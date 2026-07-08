import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateDescriptionDto {
  @ApiProperty({
    description:
      'El prompt, tema o consulta sobre el cual la IA generará la descripción',
    example: 'Motor eléctrico de inducción 2HP monofásico',
  })
  @IsNotEmpty({ message: 'La consulta o tema es requerido' })
  @IsString({ message: 'La consulta debe ser una cadena de texto' })
  query: string;

  @ApiProperty({
    description:
      'Instrucciones del sistema (system prompt) opcionales que guiarán el comportamiento y formato de la IA',
    example:
      'Eres un experto en ingeniería eléctrica. Describe la pieza técnicamente destacando su compatibilidad y materiales en formato Markdown.',
    required: false,
  })
  @IsOptional()
  @IsString({
    message: 'Las instrucciones del sistema deben ser una cadena de texto',
  })
  systemInstruction?: string;
}
