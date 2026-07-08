import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/exceptions/http.exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { stringConstants } from '@chat-monorepo/shared';
import { CustomLoggerService } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new CustomLoggerService(),
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(cookieParser());

  const isDevelopment = process.env.NODE_ENV === 'development';
  app.enableCors({
    origin: isDevelopment ? true : [process.env.APP_URL || ''],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  const config = new DocumentBuilder()
    .setTitle(stringConstants.APP_NAME)
    .setDescription(`API para ${stringConstants.APP_NAME}`)
    .setVersion(stringConstants.APP_VERSION)
    .addCookieAuth(
      'Authentication',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'Authentication',
        description: 'Cookie de sesión HTTP-only',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(parseInt(process.env.APP_PORT ?? '4001'));
}

bootstrap();
