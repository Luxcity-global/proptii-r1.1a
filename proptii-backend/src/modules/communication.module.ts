import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunicationController } from '../controllers/communication.controller';
import { StorageModule } from '../storage/storage.module';
import { Conversation, ConversationSchema } from '../schemas/conversation.schema';
import { Message, MessageSchema } from '../schemas/message.schema';
import { MongoUser, MongoUserSchema } from '../schemas/mongo-user.schema';
import { NativeProperty, NativePropertySchema } from '../schemas/native-property.schema';
import { GhostAccount, GhostAccountSchema } from '../schemas/ghost-account.schema';
import { EnquiryThread, EnquiryThreadSchema } from '../schemas/enquiry-thread.schema';
import { ThreadMessage, ThreadMessageSchema } from '../schemas/thread-message.schema';
import { GuestEnquiryModule } from './guest-enquiry.module';

@Module({
  imports: [
    StorageModule,
    GuestEnquiryModule,
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: MongoUser.name, schema: MongoUserSchema },
      { name: NativeProperty.name, schema: NativePropertySchema },
      { name: GhostAccount.name, schema: GhostAccountSchema },
      { name: EnquiryThread.name, schema: EnquiryThreadSchema },
      { name: ThreadMessage.name, schema: ThreadMessageSchema },
    ]),
  ],
  controllers: [CommunicationController],
})
export class CommunicationModule {}
