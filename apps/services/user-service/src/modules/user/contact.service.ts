import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { CustomLoggerService } from '@chat-monorepo/shared';
import { ContactEntity } from './entity/contact.entity';
import { UserEntity } from './entity/user.entity';
import { CreateContactDto } from './model/create.contact.dto';
import { UpdateContactDto } from './model/update.contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactEntity)
    private readonly contactRepository: Repository<ContactEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly logger: CustomLoggerService,
  ) { }

  async create(userId: bigint, dto: CreateContactDto): Promise<ContactEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new RpcException('El usuario propietario no existe.');
    }

    const contact = this.contactRepository.create({ ...dto, user });
    const saved = await this.contactRepository.save(contact);
    this.logger.log(
      `Contacto [${saved.id}] creado para usuario [${userId}]`,
      'CONTACT',
    );
    // No exponer la entidad de usuario (contiene el hash de contraseña) en la respuesta
    delete (saved as Partial<ContactEntity>).user;
    return saved;
  }

  async findAllByUser(userId: bigint): Promise<ContactEntity[]> {
    return await this.contactRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Busca un contacto asegurando que pertenezca al usuario indicado.
   * Lanza RpcException si no existe o no es del usuario.
   */
  async findOneOwned(userId: bigint, contactId: string): Promise<ContactEntity> {
    const contact = await this.contactRepository.findOne({
      where: { id: contactId as unknown as bigint, user: { id: userId } },
    });
    if (!contact) {
      throw new RpcException('El contacto no existe o no pertenece al usuario.');
    }
    return contact;
  }

  async update(
    userId: bigint,
    contactId: string,
    dto: UpdateContactDto,
  ): Promise<ContactEntity> {
    const contact = await this.findOneOwned(userId, contactId);
    Object.assign(contact, dto);
    const saved = await this.contactRepository.save(contact);
    this.logger.log(
      `Contacto [${contactId}] actualizado por usuario [${userId}]`,
      'CONTACT',
    );
    return saved;
  }

  async remove(userId: bigint, contactId: string): Promise<{ success: true }> {
    const contact = await this.findOneOwned(userId, contactId);
    await this.contactRepository.softRemove(contact);
    this.logger.log(
      `Contacto [${contactId}] eliminado por usuario [${userId}]`,
      'CONTACT',
    );
    return { success: true };
  }
}
