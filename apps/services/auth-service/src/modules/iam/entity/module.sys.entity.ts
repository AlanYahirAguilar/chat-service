import { Entity, Column, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '@chat-monorepo/shared';
import { Privilege } from './privilege.entity';

@Entity('module_sys')
export class ModuleSys extends Base {
  @ApiProperty({ description: 'Name of the module', example: 'Reservations' })
  @Column({ unique: true })
  name: string;

  @OneToMany(() => Privilege, (privilege) => privilege.moduleSys)
  privileges: Relation<Privilege>[];
}
