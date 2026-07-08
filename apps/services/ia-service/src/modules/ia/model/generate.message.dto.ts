import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class GenerateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  prompt: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  tone: string;
}
