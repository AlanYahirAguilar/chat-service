import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedUser } from './model/auth.interfaces';

@Injectable()
export class AuthService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) {}

  async login(loginDto: LoginDto): Promise<any> {
    try {
      return await firstValueFrom(
        this.authClient.send({ cmd: 'login' }, loginDto) as any,
      );
    } catch (error) {
      if (error.message === 'Credenciales inválidas') {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }

  async validateSession(sessionId: string): Promise<AuthenticatedUser> {
    try {
      return await firstValueFrom(
        this.authClient.send({ cmd: 'validate_session' }, sessionId) as any,
      );
    } catch (error) {
      throw new UnauthorizedException('Sesión expirada o inválida');
    }
  }

  async refreshSession(
    refreshToken: string,
    accessToken?: string,
  ): Promise<any> {
    try {
      return await firstValueFrom(
        this.authClient.send(
          { cmd: 'refresh_session' },
          { refreshToken, accessToken },
        ) as any,
      );
    } catch (error) {
      throw new UnauthorizedException('Refresh token expirado o inválido');
    }
  }

  async logout(accessToken?: string, refreshToken?: string): Promise<void> {
    await firstValueFrom(
      this.authClient.send(
        { cmd: 'logout' },
        { accessToken, refreshToken },
      ) as any,
    );
  }
}
