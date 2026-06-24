import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReferencingModule } from './referencing.module';
import { GuestEnquiryController } from '../controllers/guest-enquiry.controller';
import { GhostAccountService } from '../services/ghost-account.service';
import { EnquiryThreadService } from '../services/enquiry-thread.service';
import { EmailRelayService } from '../services/email-relay.service';
import { GhostAccount, GhostAccountSchema } from '../schemas/ghost-account.schema';
import { EnquiryThread, EnquiryThreadSchema } from '../schemas/enquiry-thread.schema';
import { ThreadMessage, ThreadMessageSchema } from '../schemas/thread-message.schema';
import { Conversation, ConversationSchema } from '../schemas/conversation.schema';
import { Message, MessageSchema } from '../schemas/message.schema';
import {
  ConversationParticipant,
  ConversationParticipantSchema,
} from '../schemas/conversation-participant.schema';
import { MongoUser, MongoUserSchema } from '../schemas/mongo-user.schema';

@Module({
  imports: [
    ReferencingModule,
    MongooseModule.forFeature([
      { name: GhostAccount.name, schema: GhostAccountSchema },
      { name: EnquiryThread.name, schema: EnquiryThreadSchema },
      { name: ThreadMessage.name, schema: ThreadMessageSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: ConversationParticipant.name, schema: ConversationParticipantSchema },
      { name: MongoUser.name, schema: MongoUserSchema },
    ]),
  ],
  controllers: [GuestEnquiryController],
  providers: [GhostAccountService, EnquiryThreadService, EmailRelayService],
  exports: [GhostAccountService, EnquiryThreadService, EmailRelayService],
})
export class GuestEnquiryModule {}
