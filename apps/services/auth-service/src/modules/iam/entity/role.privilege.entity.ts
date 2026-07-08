import { Entity, ManyToOne, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Base } from '@syncslot/shared';
import { Role } from './role.entity';
import { Privilege } from './privilege.entity';

@Entity('role_privileges')
export class RolePrivilege extends Base {
  @ManyToOne(() => Role, (role) => role.rolePrivileges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Relation<Role>;

  @ManyToOne(() => Privilege, (privilege) => privilege.rolePrivileges, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'privilege_id' })
  privilege: Relation<Privilege>;
}
