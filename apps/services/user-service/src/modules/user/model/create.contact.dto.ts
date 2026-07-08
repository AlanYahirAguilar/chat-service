import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ContactPlatform, ContactTone } from '../entity/contact.entity';

export class CreateContactDto {
  @ApiProperty({ example: 'Robert Martínez' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del contacto es obligatorio' })
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: ContactPlatform, example: ContactPlatform.WHATSAPP })
  @IsEnum(ContactPlatform, {
    message: 'La plataforma debe ser WHATSAPP, TELEGRAM o MAIL',
  })
  platform: ContactPlatform;

  @ApiProperty({
    example: '+5215555555555',
    description:
      'Teléfono (WhatsApp), chat_id/@usuario (Telegram) o correo (MAIL) según la plataforma',
  })
  @IsString()
  @IsNotEmpty({ message: 'El dato de contacto es obligatorio' })
  @MaxLength(255)
  contactInfo: string;

  @ApiProperty({ enum: ContactTone, example: ContactTone.FORMAL })
  @IsOptional()
  @IsEnum(ContactTone, {
    message: 'El tono debe ser FORMAL, INFORMAL o NEUTRO',
  })
  tone?: ContactTone;
}
