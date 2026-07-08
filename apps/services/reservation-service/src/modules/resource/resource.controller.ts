import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateResourceDto } from './model/create.resource.dto';
import { UpdateResourceDto } from './model/update.resource.dto';
import { ResourceService } from './resource.service';

@Controller()
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @MessagePattern({ cmd: 'createResource' })
  create(@Payload() createResourceDto: CreateResourceDto) {
    return this.resourceService.create(createResourceDto);
  }

  @MessagePattern({ cmd: 'findAllResources' })
  findAll(@Payload() data: { page?: number; limit?: number }) {
    const page = data?.page ?? 1;
    const limit = data?.limit ?? 10;
    return this.resourceService.findAll(page, limit);
  }

  @MessagePattern({ cmd: 'findOneResource' })
  findOne(@Payload() id: bigint) {
    return this.resourceService.findOne(id);
  }

  @MessagePattern({ cmd: 'updateResource' })
  update(@Payload() data: { id: bigint; dto: UpdateResourceDto }) {
    return this.resourceService.update(data.id, data.dto);
  }

  @MessagePattern({ cmd: 'removeResource' })
  remove(@Payload() id: bigint) {
    return this.resourceService.remove(id);
  }
}
