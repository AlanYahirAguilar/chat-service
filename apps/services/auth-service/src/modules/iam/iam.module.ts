import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IamService } from './iam.service';
import { Role } from './entity/role.entity';
import { ModuleSys } from './entity/module.sys.entity';
import { Action } from './entity/action.entity';
import { Privilege } from './entity/privilege.entity';
import { RolePrivilege } from './entity/role.privilege.entity';
import { IamController } from './iam.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Action,
      ModuleSys,
      Privilege,
      Role,
      RolePrivilege,
    ]),
  ],
  controllers: [IamController],
  providers: [IamService],
  exports: [IamService],
})
export class IamModule {}
