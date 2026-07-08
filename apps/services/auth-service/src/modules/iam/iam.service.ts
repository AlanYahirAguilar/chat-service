import { RpcException } from '@nestjs/microservices';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Privilege } from './entity/privilege.entity';
import { RolePrivilege } from './entity/role.privilege.entity';
import { Role } from './entity/role.entity';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class IamService {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Privilege)
    private readonly privilegeRepo: Repository<Privilege>,
    @InjectRepository(RolePrivilege)
    private readonly rolePrivilegeRepo: Repository<RolePrivilege>,
    @Inject('REDIS_SERVICE') private readonly redisService: ClientProxy,
  ) {}

  async getRolePrivileges(roleName: string): Promise<string[]> {
    try {
      const cacheKey = `iam:privileges:role:${roleName}`;
      const cached = await firstValueFrom(
        this.redisService.send({ cmd: 'get' }, cacheKey),
      );
      if (cached) return cached;

      const role = await this.roleRepo.findOne({ where: { name: roleName } });
      if (!role) return [];

      const rolePrivileges = await this.rolePrivilegeRepo.find({
        where: { role: { id: role.id } },
        relations: ['privilege'],
      });

      const privileges = rolePrivileges.map((rp) => rp.privilege.code);

      await firstValueFrom(
        this.redisService.send(
          { cmd: 'set' },
          {
            key: cacheKey,
            value: privileges,
            ttl: 3600,
          },
        ),
      );
      return privileges;
    } catch (error) {
      throw new RpcException(error);
      return [];
    }
  }

  // Add more methods later for managing roles and privileges
}
