import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourceService } from './resource.service';
import { ResourceController } from './resource.controller';
import { Resource } from './entity/resource.entity';
import { Schedule } from './entity/schedule.entity';

import { ResourceSubscriber } from './resource.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([Resource, Schedule])],
  controllers: [ResourceController],
  providers: [ResourceService, ResourceSubscriber],
})
export class ResourceModule {}
