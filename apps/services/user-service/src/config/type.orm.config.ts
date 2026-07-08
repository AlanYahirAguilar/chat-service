import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

const typeOrmConfig = TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get<string>('DB_HOST'),
    port: parseInt(configService.get<string>('DB_PORT') || '3306', 10),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_DATABASE'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize:
      configService.get<string>('DB_SYNCHRONIZE') === 'true' ||
      configService.get<string>('NODE_ENV') !== 'production',
    autoLoadEntities: true,
    createDatabase: true,
    logging: true,
    ssl:
      configService.get<string>('DB_SSL') === 'true'
        ? {
            rejectUnauthorized:
              configService.get<string>('DB_SSL_REJECT_UNAUTHORIZED') !==
              'false',
          }
        : undefined,
  }),
  inject: [ConfigService],
});

export default typeOrmConfig;
