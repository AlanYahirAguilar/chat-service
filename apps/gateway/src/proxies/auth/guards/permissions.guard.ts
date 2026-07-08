import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PRIVILEGES_KEY } from '../decorators/require.privilege.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    const requiredPrivileges = this.reflector.getAllAndOverride<string[]>(
      PRIVILEGES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPrivileges || requiredPrivileges.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('User or role not found in request');
    }

    // Query roles and privileges from auth-service microservice via TCP
    let userPrivileges: string[] = [];
    try {
      userPrivileges = await firstValueFrom(
        this.authClient.send<string[]>({ cmd: 'getRolePrivileges' }, user.role),
      );
    } catch {
      throw new ForbiddenException('Could not verify role privileges');
    }

    const hasPermission = requiredPrivileges.every((privilege) =>
      userPrivileges.includes(privilege),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient privileges. Required: ${requiredPrivileges.join(', ')}`,
      );
    }

    return true;
  }
}
