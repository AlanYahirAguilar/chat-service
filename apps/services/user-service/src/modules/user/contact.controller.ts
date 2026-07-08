import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ContactService } from './contact.service';
import { CreateContactDto } from './model/create.contact.dto';
import { UpdateContactDto } from './model/update.contact.dto';

@Controller()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @MessagePattern({ cmd: 'create_contact' })
  async create(
    @Payload() data: { userId: bigint; dto: CreateContactDto },
  ) {
    return await this.contactService.create(data.userId, data.dto);
  }

  @MessagePattern({ cmd: 'find_contacts' })
  async findAll(@Payload() data: { userId: bigint }) {
    return await this.contactService.findAllByUser(data.userId);
  }

  @MessagePattern({ cmd: 'find_contact' })
  async findOne(@Payload() data: { userId: bigint; contactId: string }) {
    return await this.contactService.findOneOwned(data.userId, data.contactId);
  }

  @MessagePattern({ cmd: 'update_contact' })
  async update(
    @Payload()
    data: { userId: bigint; contactId: string; dto: UpdateContactDto },
  ) {
    return await this.contactService.update(
      data.userId,
      data.contactId,
      data.dto,
    );
  }

  @MessagePattern({ cmd: 'delete_contact' })
  async remove(@Payload() data: { userId: bigint; contactId: string }) {
    return await this.contactService.remove(data.userId, data.contactId);
  }
}
