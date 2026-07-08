import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import typeOrmConfig from './config/type.orm.config';
import { MediaModule } from './modules/media/media.module';
import { StorageModule } from './modules/storage/storage.module';

import { LoggerModule } from '@syncslot/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    typeOrmConfig,
    MediaModule,
    StorageModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
