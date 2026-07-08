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
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ContactEntity, MessageHistoryEntity])],
  controllers: [UserController, MessageDispatcherController, ContactController],
  providers: [UserService, UserSubscriber, MessageDispatcherService, ContactService],
  exports: [UserService, MessageDispatcherService, ContactService],
})
export class UserModule {}
