import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  prompt: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  tone: string;

  /**
   * Canal destino. Si es MAIL, la IA además genera un asunto (subject).
   * Para WHATSAPP/TELEGRAM solo se genera el cuerpo del mensaje.
   */
  @IsOptional()
  @IsIn(['WHATSAPP', 'TELEGRAM', 'MAIL'])
  channel?: 'WHATSAPP' | 'TELEGRAM' | 'MAIL';
}
