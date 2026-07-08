import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../../modules/user/entity/user.entity';

type UserRole = 'ADMIN' | 'OPERATOR' | 'CLIENT' | 'SUPERVISOR';
type UserStatus = 'ACTIVE' | 'INACTIVE';

interface UserSeedData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: UserRole;
  status: UserStatus;
}

const USERS: UserSeedData[] = [
  {
    name: 'Administrador Sistema',
    email: 'sussasos82@gmail.com',
    phoneNumber: '+5215500000001',
    password: 'Password123',
    role: 'ADMIN',
    status: 'ACTIVE',
  },
  {
    name: 'Supervisor General',
    email: '20233tn135@utez.edu.mx',
    phoneNumber: '+5215500000002',
    password: 'Password123',
    role: 'SUPERVISOR',
    status: 'ACTIVE',
  },
  {
    name: 'Operador Principal',
    email: '20233tn113@utez.edu.mx',
    phoneNumber: '+5215500000003',
    password: 'Password123',
    role: 'OPERATOR',
    status: 'ACTIVE',
  },
  {
    name: 'Cliente Demo Uno',
    email: '20233tn129@utez.edu.mx',
    phoneNumber: '+5215500000004',
    password: 'Password123',
    role: 'CLIENT',
    status: 'ACTIVE',
  },
  {
    name: 'Cliente Demo Dos',
    email: '20233tn139@utez.edu.mx',
    phoneNumber: '+5215500000005',
    password: 'Password123',
    role: 'CLIENT',
    status: 'ACTIVE',
  },
  {
    name: 'Cliente Demo Tres',
    email: '20233tn112@utez.edu.mx',
    phoneNumber: '+5215500000006',
    password: 'Password123',
    role: 'CLIENT',
    status: 'ACTIVE',
  },
  {
    name: 'Cliente Demo Cuatro',
    email: '20233tn115@utez.edu.mx',
    phoneNumber: '+5215500000007',
    password: 'Password123',
    role: 'CLIENT',
    status: 'ACTIVE',
  },
];

export class UserSeeder {
  async run(dataSource: DataSource): Promise<void> {
    const userRepo = dataSource.getRepository(UserEntity);
    const SALT_ROUNDS = 10;
    let created = 0;
    let skipped = 0;

    for (const userData of USERS) {
      const existing = await userRepo.findOne({
        where: { email: userData.email },
      });
      if (existing) {
        skipped++;
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
      const user = userRepo.create({
        name: userData.name,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        password: hashedPassword,
        role: userData.role,
        status: userData.status,
        lastSessionAt: null,
        code: null,
        codeCreatedAt: null,
      });

      await userRepo.save(user);
      console.log(`  → Created user [${userData.role}]: ${userData.email}`);
      created++;
    }

    if (skipped > 0) {
      console.log(`  → Skipped ${skipped} existing users`);
    }
    console.log(`  → Total: ${created} users created`);
  }
}
