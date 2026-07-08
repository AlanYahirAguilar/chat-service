import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { authConfig } from '@/config/auth.config';
import { CustomLoggerService } from '@/common/logger/logger.service';
import {
  JwtPayload,
  AuthenticatedUser,
} from '@/proxies/auth/model/auth.interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly logger: CustomLoggerService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.[authConfig.getAccessCookieName()];
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    this.logger.log(`[JwtStrategy_validate] Validating JWT payload`, 'REQUEST');

    if (!payload.sessionId) {
      this.logger.error(
        '[JwtStrategy_validate] No sessionId present in JWT payload',
        undefined,
        'EXCEPTION',
      );
      throw new UnauthorizedException('Token inválido');
    }

    return this.authService.validateSession(payload.sessionId);
  }
}
