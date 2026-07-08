import { JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export const authConfig = {
  // Session details
  getSessionTtl: (configService: ConfigService): number => {
    return parseInt(configService.get<string>('SESSION_TTL') || '86400', 10);
  },

  getRefreshTtl: (configService: ConfigService): number => {
    return Math.floor(
      parseInt(
        configService.get<string>('COOKIE_REFRESH_MAX_AGE') || '86400000',
        10,
      ) / 1000,
    );
  },

  // JWT asynchronous registration config
  jwtAsyncConfig: {
    useFactory: (configService: ConfigService): JwtModuleOptions => ({
      secret: configService.get<string>('JWT_SECRET'),
      signOptions: {
        expiresIn: (configService.get<string>('JWT_ACCESS_EXPIRES_IN') ||
          '15m') as any,
        algorithm: 'HS256',
      },
    }),
    inject: [ConfigService],
  },
};
