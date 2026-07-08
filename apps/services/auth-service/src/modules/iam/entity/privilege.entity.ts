import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Base } from '@syncslot/shared';
import { ModuleSys } from './module.sys.entity';
import { Action } from './action.entity';
import { RolePrivilege } from './role.privilege.entity';

@Entity('privileges')
export class Privilege extends Base {
  @ApiProperty({
    description: 'Code for the privilege',
    example: 'reservations:delete',
  })
  @Column({ unique: true })
  code: string;

  @ManyToOne(() => ModuleSys, (moduleSys) => moduleSys.privileges)
  @JoinColumn({ name: 'module_sys_id' })
  moduleSys: Relation<ModuleSys>;

  @ManyToOne(() => Action, (action) => action.privileges)
  @JoinColumn({ name: 'action_id' })
  action: Relation<Action>;

  @OneToMany(() => RolePrivilege, (rolePrivilege) => rolePrivilege.privilege)
  rolePrivileges: Relation<RolePrivilege>[];
}
