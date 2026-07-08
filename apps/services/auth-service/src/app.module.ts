import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import typeOrmConfig from './config/type.orm.config';
import { AuthModule } from './modules/auth/auth.module';
import { LoggerModule } from '@chat-monorepo/shared';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { IamModule } from './modules/iam/iam.module';
import { SharedClientsModule } from './common/shared.clients.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../../.env' }),
    typeOrmConfig,
    SharedClientsModule,
    AuthModule,
    IamModule,
    LoggerModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule { }
