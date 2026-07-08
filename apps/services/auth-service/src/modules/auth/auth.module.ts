import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { authConfig } from '@/config/auth.config';

@Module({
  imports: [JwtModule.registerAsync(authConfig.jwtAsyncConfig)],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
