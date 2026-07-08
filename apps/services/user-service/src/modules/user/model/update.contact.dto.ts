import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ContactPlatform, ContactTone } from '../entity/contact.entity';

export class UpdateContactDto {
  @ApiProperty({ example: 'Robert Martínez', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @MaxLength(255)
  name?: string;

  @ApiProperty({ enum: ContactPlatform, required: false })
  @IsOptional()
  @IsEnum(ContactPlatform, {
    message: 'La plataforma debe ser WHATSAPP, TELEGRAM o MAIL',
  })
  platform?: ContactPlatform;

  @ApiProperty({ example: '+5215555555555', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El dato de contacto no puede estar vacío' })
  @MaxLength(255)
  contactInfo?: string;

  @ApiProperty({ enum: ContactTone, required: false })
  @IsOptional()
  @IsEnum(ContactTone, {
    message: 'El tono debe ser FORMAL, INFORMAL o NEUTRO',
  })
  tone?: ContactTone;
}
