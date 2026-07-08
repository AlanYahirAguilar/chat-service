import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { LoginDto } from '@syncslot/shared';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'login' })
  async login(@Payload() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @MessagePattern({ cmd: 'validate_session' })
  async validateSession(@Payload() sessionId: string) {
    return this.authService.validateSession(sessionId);
  }

  @MessagePattern({ cmd: 'refresh_session' })
  async refreshSession(
    @Payload() data: { refreshToken: string; accessToken?: string },
  ) {
    return this.authService.refreshSession(data.refreshToken, data.accessToken);
  }

  @MessagePattern({ cmd: 'logout' })
  async logout(
    @Payload() data: { accessToken?: string; refreshToken?: string },
  ) {
    await this.authService.logout(data.accessToken, data.refreshToken);
    return { success: true };
  }
}
