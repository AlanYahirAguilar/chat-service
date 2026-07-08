import { Entity, Column, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '@syncslot/shared';
import { RolePrivilege } from './role.privilege.entity';

@Entity('roles')
export class Role extends Base {
  @ApiProperty({ description: 'Name of the role', example: 'Operator' })
  @Column({ unique: true })
  name: string;

  @OneToMany(() => RolePrivilege, (rolePrivilege) => rolePrivilege.role)
  rolePrivileges: Relation<RolePrivilege>[];
}
