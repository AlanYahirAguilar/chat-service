import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IamService } from './iam.service';

@Controller()
export class IamController {
  constructor(private readonly iamService: IamService) {}

  @MessagePattern({ cmd: 'getRolePrivileges' })
  async getRolePrivileges(
    @Payload() roles: string[] | string,
  ): Promise<string[]> {
    const roleName = Array.isArray(roles) ? roles[0] : roles;
    return this.iamService.getRolePrivileges(roleName);
  }
}
