import { ApiProperty } from '@nestjs/swagger';
import { Base } from '@syncslot/shared';
import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity';

export enum ContactPlatform {
  WHATSAPP = 'WHATSAPP',
  TELEGRAM = 'TELEGRAM',
  MAIL = 'MAIL',
}

export enum ContactTone {
  FORMAL = 'FORMAL',
  INFORMAL = 'INFORMAL',
  NEUTRO = 'NEUTRO',
}

@Entity('contact')
export class ContactEntity extends Base {
  @Column('varchar', {
    name: 'name',
    comment: 'Contact name',
    length: 255,
  })
  @ApiProperty({ example: 'Juan Perez' })
  name: string;

  @Column('enum', {
    name: 'platform',
    comment: 'Messaging platform',
    enum: ContactPlatform,
    default: ContactPlatform.WHATSAPP,
  })
  @ApiProperty({ example: ContactPlatform.WHATSAPP, enum: ContactPlatform })
  platform: ContactPlatform;

  @Column('varchar', {
    name: 'contact_info',
    comment: 'Phone number or email depending on platform',
    length: 255,
  })
  @ApiProperty({ example: '+525555555555' })
  contactInfo: string;

  @Column('enum', {
    name: 'tone',
    comment: 'Tone of voice for messages',
    enum: ContactTone,
    default: ContactTone.NEUTRO,
  })
  @ApiProperty({ example: ContactTone.FORMAL, enum: ContactTone })
  tone: ContactTone;

  @ManyToOne(() => UserEntity, (user) => user.contacts)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
