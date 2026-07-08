import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserEntity } from './entity/user.entity';
import { ContactEntity } from './entity/contact.entity';
import { MessageHistoryEntity } from './entity/message-history.entity';
import { UserSubscriber } from './user.subscriber';
import { MessageDispatcherService } from './message-dispatcher.service';
import { MessageDispatcherController } from './message-dispatcher.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ContactEntity, MessageHistoryEntity])],
  controllers: [UserController, MessageDispatcherController],
  providers: [UserService, UserSubscriber, MessageDispatcherService],
  exports: [UserService, MessageDispatcherService],
})
export class UserModule {}
