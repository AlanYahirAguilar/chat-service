import { DataSource } from 'typeorm';
import { Action } from '../../modules/iam/entity/action.entity';
import { ModuleSys } from '../../modules/iam/entity/module.sys.entity';
import { Privilege } from '../../modules/iam/entity/privilege.entity';
import { Role } from '../../modules/iam/entity/role.entity';
import { RolePrivilege } from '../../modules/iam/entity/role.privilege.entity';

const ACTIONS = ['create', 'read', 'update', 'delete', 'edit'];

const MODULES = [
  'users',
  'resources',
  'schedules',
  'reservations',
  'payments',
  'availability',
  'reports',
  'iam',
  'whatsapp',
  'mail',
  'redis',
  'settings',
  'themes',
  'media',
];

const PRIVILEGE_MATRIX: Record<string, string[]> = {
  users: ['create', 'read', 'update', 'delete'],
  resources: ['create', 'read', 'update', 'delete'],
  schedules: ['create', 'read', 'update', 'delete'],
  reservations: ['create', 'read', 'update', 'delete', 'delete_others'],
  payments: ['create', 'read', 'update', 'delete'],
  availability: ['read'],
  reports: ['create', 'read', 'delete'],
  iam: ['create', 'read', 'update', 'delete'],
  whatsapp: ['create', 'read', 'update', 'delete'],
  mail: ['create', 'read', 'update', 'delete'],
  redis: ['create', 'read', 'update', 'delete'],
  settings: ['edit'],
  themes: ['create', 'read', 'update', 'delete'],
  media: ['create', 'read', 'update', 'delete'],
};

const ALL_PRIVILEGE_CODES = Object.entries(PRIVILEGE_MATRIX).flatMap(
  ([mod, actions]) => actions.map((a) => `${mod}:${a}`),
);

const ROLE_PRIVILEGES: Record<string, string[]> = {
  ADMIN: ALL_PRIVILEGE_CODES,
  SUPERVISOR: ALL_PRIVILEGE_CODES.filter((code) => !code.startsWith('iam:')),
  OPERATOR: [
    'resources:read',
    'schedules:read',
    'availability:read',
    'reservations:create',
    'reservations:read',
    'reservations:update',
    'payments:read',
    'reports:read',
    'media:read',
    'media:create',
  ],
  CLIENT: [
    'resources:read',
    'schedules:read',
    'availability:read',
    'reservations:create',
    'reservations:read',
    'payments:read',
    'media:read',
  ],
};

export class IamSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const actionRepo = dataSource.getRepository(Action);
    const moduleRepo = dataSource.getRepository(ModuleSys);
    const privilegeRepo = dataSource.getRepository(Privilege);
    const roleRepo = dataSource.getRepository(Role);
    const rolePrivilegeRepo = dataSource.getRepository(RolePrivilege);

    console.log('  → Seeding actions...');
    const actionMap: Record<string, Action> = {};
    for (const name of ACTIONS) {
      let action = await actionRepo.findOne({ where: { name } });
      if (!action) {
        action = await actionRepo.save(actionRepo.create({ name }));
      }
      actionMap[name] = action;
    }
    console.log(`     ${ACTIONS.length} actions ready`);

    console.log('  → Seeding system modules...');
    const moduleMap: Record<string, ModuleSys> = {};
    for (const name of MODULES) {
      let mod = await moduleRepo.findOne({ where: { name } });
      if (!mod) {
        mod = await moduleRepo.save(moduleRepo.create({ name }));
      }
      moduleMap[name] = mod;
    }
    console.log(`     ${MODULES.length} modules ready`);

    console.log('  → Seeding privileges...');
    const privilegeMap: Record<string, Privilege> = {};
    let newPrivileges = 0;
    for (const [modName, actions] of Object.entries(PRIVILEGE_MATRIX)) {
      for (const actionName of actions) {
        const code = `${modName}:${actionName}`;
        let priv = await privilegeRepo.findOne({ where: { code } });
        if (!priv) {
          priv = await privilegeRepo.save(
            privilegeRepo.create({
              code,
              moduleSys: moduleMap[modName],
              action: actionMap[actionName],
            }),
          );
          newPrivileges++;
        }
        privilegeMap[code] = priv;
      }
    }
    console.log(
      `     ${ALL_PRIVILEGE_CODES.length} privileges ready (${newPrivileges} new)`,
    );

    console.log('  → Seeding roles...');
    const roleMap: Record<string, Role> = {};
    for (const roleName of Object.keys(ROLE_PRIVILEGES)) {
      let role = await roleRepo.findOne({ where: { name: roleName } });
      if (!role) {
        role = await roleRepo.save(roleRepo.create({ name: roleName }));
      }
      roleMap[roleName] = role;
    }
    console.log(`     ${Object.keys(ROLE_PRIVILEGES).length} roles ready`);

    console.log('  → Seeding role-privilege assignments...');
    let newAssignments = 0;
    for (const [roleName, codes] of Object.entries(ROLE_PRIVILEGES)) {
      const role = roleMap[roleName];
      for (const code of codes) {
        const privilege = privilegeMap[code];
        if (!privilege) continue;

        const exists = await rolePrivilegeRepo
          .createQueryBuilder('rp')
          .where('rp.role_id = :roleId AND rp.privilege_id = :privilegeId', {
            roleId: role.id,
            privilegeId: privilege.id,
          })
          .getOne();

        if (!exists) {
          await rolePrivilegeRepo.save(
            rolePrivilegeRepo.create({ role, privilege }),
          );
          newAssignments++;
        }
      }
    }
    console.log(`     Assignments complete (${newAssignments} new)`);
  }
}
