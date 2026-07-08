import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '@/proxies/auth/auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LoginDto } from '@/proxies/auth/dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { authConfig } from '@/config/auth.config';
import { Throttle } from '@nestjs/throttler';
import type { Response, Request } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private setAuthCookies(
    res: Response,
    result: { access_token: string; refresh_token: string },
  ): void {
    const isProd = authConfig.isProduction(this.configService);

    res.cookie(authConfig.getAccessCookieName(), result.access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: authConfig.getAccessCookieMaxAge(this.configService),
    });

    res.cookie(authConfig.getRefreshCookieName(), result.refresh_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: authConfig.getRefreshCookieMaxAge(this.configService),
    });
  }

  private clearAuthCookies(res: Response): void {
    const isProd = authConfig.isProduction(this.configService);

    res.clearCookie(authConfig.getAccessCookieName(), {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
    });

    res.clearCookie(authConfig.getRefreshCookieName(), {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
    });
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica a un usuario',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({
    status: 400,
    description: 'Petición inválida (DTO mal estructurado)',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas o sesión expirada',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    this.setAuthCookies(res, result);
    return result;
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Renovar sesión',
    description: 'Renueva el access token usando el refresh token',
  })
  @ApiResponse({ status: 200, description: 'Token renovado exitosamente' })
  @ApiResponse({
    status: 401,
    description: 'Refresh token expirado o no proporcionado',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[authConfig.getRefreshCookieName()];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token no proporcionado');
    }

    const accessToken =
      req.cookies?.[authConfig.getAccessCookieName()] ||
      req.headers.authorization?.split(' ')[1];
    const result = await this.authService.refreshSession(
      refreshToken,
      accessToken,
    );

    this.setAuthCookies(res, result);
    return result;
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Cerrar sesión',
    description: 'Invalida la sesión actual y limpia las cookies',
  })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const accessToken =
      req.cookies?.[authConfig.getAccessCookieName()] ||
      req.headers.authorization?.split(' ')[1];
    const refreshToken = req.cookies?.[authConfig.getRefreshCookieName()];

    await this.authService.logout(accessToken, refreshToken);
    this.clearAuthCookies(res);

    return { message: 'Sesión cerrada' };
  }
}
