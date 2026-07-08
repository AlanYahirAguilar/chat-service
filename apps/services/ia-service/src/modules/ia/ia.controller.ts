import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IaService } from './ia.service';
import { GenerateDescriptionDto } from './model/generate.description.dto';

@Controller()
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @MessagePattern({ cmd: 'generateDescription' })
  generateDescription(
    @Payload() generateDescriptionDto: GenerateDescriptionDto,
  ) {
    return this.iaService.generateDescription(generateDescriptionDto);
  }
}
