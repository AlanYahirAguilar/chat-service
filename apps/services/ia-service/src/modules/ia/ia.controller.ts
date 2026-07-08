import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IaService } from './ia.service';
import { GenerateDescriptionDto } from './model/generate.description.dto';
import { GenerateMessageDto } from './model/generate.message.dto';

@Controller()
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @MessagePattern({ cmd: 'generateDescription' })
  generateDescription(
    @Payload() generateDescriptionDto: GenerateDescriptionDto,
  ) {
    return this.iaService.generateDescription(generateDescriptionDto);
  }

  @MessagePattern({ cmd: 'generateMessage' })
  generateMessage(@Payload() generateMessageDto: GenerateMessageDto) {
    return this.iaService.generateMessage(generateMessageDto);
  }
}
