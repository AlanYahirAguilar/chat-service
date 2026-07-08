import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '@/proxies/auth/model/auth.interfaces';

/**
 * Extrae el usuario autenticado (inyectado por JwtAuthGuard en request.user).
 * Uso: `@CurrentUser() user: AuthenticatedUser` o `@CurrentUser('id') userId: bigint`
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;
    return data ? user?.[data] : user;
  },
);
