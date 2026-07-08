import { Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaEntity } from './entity/media.entity';
import { StorageModule } from '../storage/storage.module';
@Module({
  imports: [TypeOrmModule.forFeature([MediaEntity]), StorageModule],
  controllers: [MediaController],
  providers: [MediaService, Logger],
  exports: [MediaService],
})
export class MediaModule {}
