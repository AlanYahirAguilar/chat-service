import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

export const throttlerConfig = {
  imports: [],
  useFactory: (configService: ConfigService): ThrottlerModuleOptions => [
    {
      ttl: parseInt(configService.get<string>('THROTTLE_TTL') || '300000', 10),
      limit: parseInt(configService.get<string>('THROTTLE_LIMIT') || '200', 10),
    },
  ],
  inject: [ConfigService],
};
