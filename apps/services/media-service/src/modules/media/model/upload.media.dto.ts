import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UploadMediaDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Archivos a subir',
  })
  files: any[];

  @ApiProperty({
    description: 'ID de la entidad relacionada',
    example: '1',
  })
  @IsNotEmpty()
  @IsString()
  entityId: string;

  @ApiProperty({
    description:
      'Tipo de entidad relacionada (ej. PRODUCT, SPARE_PART, USER, etc.)',
    example: 'PRODUCT',
  })
  @IsNotEmpty()
  @IsString()
  entityType: string;
}
