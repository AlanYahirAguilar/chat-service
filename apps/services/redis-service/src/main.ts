import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { CustomLoggerService } from '@chat-monorepo/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CustomLoggerService(),
  });
  const configService = app.get(ConfigService);

  // Railway inyecta PORT; en local se usa REDIS_SERVICE_PORT o el default.
  const port = parseInt(
    process.env.PORT ?? configService.get<string>('REDIS_SERVICE_PORT', '4008'),
    10,
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      // En Railway la red privada es IPv6: definir HOST='::'
      host: process.env.HOST ?? '0.0.0.0',
      port: port,
    },
  });

  app.enableShutdownHooks();
  await app.startAllMicroservices();
  await app.init();

  console.log(`[redis-service] Microservice started on TCP port ${port}`);
}
bootstrap().catch((err) => {
  console.error(err);
});
