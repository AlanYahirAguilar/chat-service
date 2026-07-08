import { Entity, Column, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '@syncslot/shared';
import { Privilege } from './privilege.entity';

@Entity('actions')
export class Action extends Base {
  @ApiProperty({ description: 'Name of the action', example: 'create' })
  @Column({ unique: true })
  name: string;

  @OneToMany(() => Privilege, (privilege: Privilege) => privilege.action)
  privileges: Relation<Privilege>[];
}
