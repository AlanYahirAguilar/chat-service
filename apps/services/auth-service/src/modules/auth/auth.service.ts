// @ts-nocheck
import { compare, hash } from 'bcryptjs';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { Inject, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { LoginDto } from '@syncslot/shared';
import { comparePasswords, generateSecureToken } from '@syncslot/shared';

import { ConfigService } from '@nestjs/config';
import { authConfig } from '@/config/auth.config';
import { IamService } from '@/modules/iam/iam.service';
import {
  JwtPayload,
  SessionData,
  AuthenticatedUser,
  UserRepresentation,
} from '@/modules/auth/model/auth.interfaces';

@Injectable()
export class AuthService {
  @Inject('REDIS_SERVICE') private readonly redisService: ClientProxy;

  private readonly logger = new Logger(AuthService.name);
  constructor(
    @Inject('USER_SERVICE') private readonly usersService: ClientProxy,
    private readonly jwtService: JwtService,

    private readonly configService: ConfigService,

    private readonly iamService: IamService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserRepresentation | null> {
    const user = await firstValueFrom(
      this.usersService.send({ cmd: 'find_by_email' }, email),
    );
    if (user && (await compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<{
    access_token: string;
    refresh_token: string;
    user: {
      id: bigint;
      email: string;
      name: string;
      role: string;
      privileges: string[];
    };
  }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      this.logger.error(
        '[AuthService_login] Invalid credentials',
        undefined,
        'EXCEPTION',
      );
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await firstValueFrom(
      this.usersService.send({ cmd: 'update_last_session' }, user.id.toString()),
    );

    // 1. Generate Opaque Token using the extracted utility
    const sessionId = generateSecureToken(32);

    // 2. Persist in Redis
    const sessionTtl = authConfig.getSessionTtl(this.configService);
    const sessionData: SessionData = {
      id: user.id.toString(),
      role: user.role,
    };
    await firstValueFrom(
      this.redisService.send({ cmd: 'set' }, {
        key: `session:${sessionId}`,
        value: sessionData,
        ttl: sessionTtl,
      })
    );

    // 3. Sign JWT with opaque token only
    const payload: JwtPayload = { sessionId };

    this.logger.log(
      `[AuthService_login] Generating token with payload: ${JSON.stringify(payload)}`,
      'REQUEST',
    );

    const token = this.jwtService.sign(payload);

    // 4. Generate Refresh Token
    const refreshToken = generateSecureToken(64);
    const refreshTtl = authConfig.getRefreshTtl(this.configService);
    await firstValueFrom(
      this.redisService.send({ cmd: 'set' }, {
        key: `refresh:${refreshToken}`,
        value: { id: user.id.toString() },
        ttl: refreshTtl,
      })
    );

    const privileges = await this.iamService.getRolePrivileges(user.role);

    return {
      access_token: token,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        privileges,
      },
    };
  }

  async validateSession(sessionId: string): Promise<AuthenticatedUser> {
    const sessionData = await firstValueFrom(
      this.redisService.send({ cmd: 'get' }, `session:${sessionId}`)
    );

    if (!sessionData) {
      this.logger.error(
        `[AuthService_validateSession] Session not found or expired for sessionId: ${sessionId}`,
        undefined,
        'EXCEPTION',
      );
      throw new UnauthorizedException('Sesión expirada o inválida');
    }

    const user = await firstValueFrom(
      this.usersService.send({ cmd: 'find_user_by_id' }, sessionData.id),
    );
    if (!user) {
      this.logger.error(
        `[AuthService_validateSession] User not found for id: ${sessionData.id}`,
        undefined,
        'EXCEPTION',
      );
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    };
  }

  async refreshSession(
    refreshToken: string,
    accessToken?: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const refreshData = await firstValueFrom(
      this.redisService.send({ cmd: 'get' }, `refresh:${refreshToken}`)
    );

    if (!refreshData) {
      this.logger.error(
        `[AuthService_refreshSession] Refresh token not found or expired`,
        undefined,
        'EXCEPTION',
      );
      throw new UnauthorizedException('Refresh token expirado o inválido');
    }

    const user = await firstValueFrom(
      this.usersService.send({ cmd: 'find_user_by_id' }, refreshData.id),
    );
    if (!user) {
      this.logger.error(
        `[AuthService_refreshSession] User not found for id: ${refreshData.id}`,
        undefined,
        'EXCEPTION',
      );
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Delete old refresh token (rotation)
    await firstValueFrom(
      this.redisService.send({ cmd: 'del' }, `refresh:${refreshToken}`)
    );

    // Try to extract old sessionId from access token (even if expired) to prevent orphaned sessions in Redis
    let oldSessionId: string | undefined;
    if (accessToken) {
      try {
        const decoded = this.jwtService.decode(accessToken);
        if (decoded && decoded.sessionId) {
          oldSessionId = decoded.sessionId;
        }
      } catch (err) {
        // Ignored
      }
    }

    // Delete old session token to prevent orphaned session keys in Redis
    if (oldSessionId) {
      await firstValueFrom(
        this.redisService.send({ cmd: 'del' }, `session:${oldSessionId}`)
      );
      this.logger.log(
        `[AuthService_refreshSession] Cleaned up old session: ${oldSessionId}`,
        'REQUEST',
      );
    }

    // Generate new Session and Access Token
    const sessionId = generateSecureToken(32);
    const sessionTtl = authConfig.getSessionTtl(this.configService);
    const sessionData: SessionData = {
      id: user.id.toString(),
      role: user.role,
    };

    await firstValueFrom(
      this.redisService.send({ cmd: 'set' }, {
        key: `session:${sessionId}`,
        value: sessionData,
        ttl: sessionTtl,
      })
    );

    const payload: JwtPayload = { sessionId };
    const newAccessToken = this.jwtService.sign(payload);

    // Generate new Refresh Token
    const newRefreshToken = generateSecureToken(64);
    const refreshTtl = authConfig.getRefreshTtl(this.configService);
    await firstValueFrom(
      this.redisService.send({ cmd: 'set' }, {
        key: `refresh:${newRefreshToken}`,
        value: { id: user.id.toString() },
        ttl: refreshTtl,
      })
    );

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  async logout(accessToken?: string, refreshToken?: string): Promise<void> {
    let sessionId: string | undefined;
    if (accessToken) {
      try {
        const decoded = this.jwtService.decode(accessToken);
        if (decoded && decoded.sessionId) {
          sessionId = decoded.sessionId;
        }
      } catch (err) {
        // Ignored
      }
    }

    if (sessionId) {
      await firstValueFrom(
        this.redisService.send({ cmd: 'del' }, `session:${sessionId}`)
      );
      this.logger.log(
        `[AuthService_logout] Successfully invalidated session: ${sessionId}`,
        'REQUEST',
      );
    }
    if (refreshToken) {
      await firstValueFrom(
        this.redisService.send({ cmd: 'del' }, `refresh:${refreshToken}`)
      );
      this.logger.log(
        `[AuthService_logout] Successfully invalidated refresh token: ${refreshToken}`,
        'REQUEST',
      );
    }
  }
}
