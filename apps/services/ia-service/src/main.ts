import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { CustomLoggerService } from '@syncslot/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CustomLoggerService(),
  });
  const configService = app.get(ConfigService);

  const port = parseInt(
    configService.get<string>('IA_SERVICE_PORT', '4004'),
    10,
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: port,
    },
  });

  await app.startAllMicroservices();
  await app.init();

  console.log(`[ia-service] Microservice started on TCP port ${port}`);
}
bootstrap().catch((err) => {
  console.error(err);
});
