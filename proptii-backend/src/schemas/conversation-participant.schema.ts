import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type ConversationParticipantDocument = HydratedDocument<ConversationParticipant>;

@Schema({ collection: 'conversation_participants', timestamps: false })
export class ConversationParticipant {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  conversationId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, enum: ['tenant', 'landlord'] })
  role: 'tenant' | 'landlord';

  @Prop({ required: true })
  joinedAt: string;
}

export const ConversationParticipantSchema = SchemaFactory.createForClass(ConversationParticipant);

ConversationParticipantSchema.index({ conversationId: 1, userId: 1 });
