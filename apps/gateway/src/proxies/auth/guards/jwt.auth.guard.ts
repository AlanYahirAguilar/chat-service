import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@/proxies/auth/decorators/public.decorator';
import { CustomLoggerService } from '@/common/logger/logger.service';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: CustomLoggerService,
  ) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    this.logger.log(
      `[JwtAuthGuard_canActivate] Authorizing request for path: ${request.path}`,
      'REQUEST',
    );

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      this.logger.error(
        `[JwtAuthGuard_handleRequest] Validation failed: ${err?.message || info?.message || 'Usuario no autorizado'}`,
        err?.stack,
        'EXCEPTION',
      );
      throw (
        err ||
        new UnauthorizedException(info?.message || 'Usuario no autorizado')
      );
    }

    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      request.user = user;
      this.logger.log(
        `[JwtAuthGuard_handleRequest] User successfully set in request for ID: ${user.id}`,
        'REQUEST',
      );
    }

    return user;
  }
}
