import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ collection: 'messages', timestamps: false })
export class Message {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  conversationId: string;

  @Prop({ required: true })
  senderId: string;

  @Prop({ required: true, enum: ['tenant', 'landlord'] })
  senderRole: 'tenant' | 'landlord';

  @Prop({ required: false, default: '', maxlength: 4000 })
  body: string;

  @Prop({ type: [String], default: [] })
  attachmentIds: string[];

  @Prop({ required: true })
  sentAt: string;

  @Prop({ default: null })
  readAt: string | null;

  @Prop({ required: true, default: false })
  isDeleted: boolean;

  @Prop({ default: null })
  deletedAt: string | null;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ conversationId: 1, sentAt: 1 });
