import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@/proxies/auth/enums/role.enum';
import { ROLES_KEY } from '@/proxies/auth/decorators/roles.decorator';
import { CustomLoggerService } from '@/common/logger/logger.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: CustomLoggerService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') {
      return true;
    }

    const requiredRoles = this.reflector.get<Role[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    this.logger.log(
      `[RolesGuard_canActivate] Checking roles for user in path: ${request.path}`,
      'REQUEST',
    );

    if (!request.user) {
      this.logger.error(
        '[RolesGuard_canActivate] Access denied: No user found in request',
        undefined,
        'EXCEPTION',
      );
      return false;
    }

    const hasRole = requiredRoles.includes(request.user.role);

    if (!hasRole) {
      this.logger.error(
        `[RolesGuard_canActivate] Access denied: User ${request.user.id} has role ${request.user.role} but requires [${requiredRoles.join(', ')}]`,
        undefined,
        'EXCEPTION',
      );
    } else {
      this.logger.log(
        `[RolesGuard_canActivate] Access granted: User ${request.user.id} has role ${request.user.role}`,
        'REQUEST',
      );
    }

    return hasRole;
  }
}
