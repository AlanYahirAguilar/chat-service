import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export const redisConfig = {
  useFactory: (configService: ConfigService): RedisOptions => {
    const host = configService.get<string>('REDIS_HOST', 'localhost');
    const port = parseInt(
      configService.get<string>('REDIS_PORT') || '6379',
      10,
    );
    const password = configService.get<string>('REDIS_PASSWORD', '');
    const username = configService.get<string>('REDIS_USERNAME', '');

    const options: RedisOptions = { host, port };

    if (password) {
      options.password = password;
      if (username) {
        options.username = username;
      }
    }
    return options;
  },
  inject: [ConfigService],
};
