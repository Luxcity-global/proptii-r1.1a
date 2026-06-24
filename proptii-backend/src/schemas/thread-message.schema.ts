import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type ThreadMessageSenderType =
  | 'ghost_tenant'
  | 'ghost_landlord'
  | 'platform_landlord';

export type ThreadMessageSource =
  | 'web_form'
  | 'email_reply'
  | 'tokenised_page';

export type ThreadMessageDocument = HydratedDocument<ThreadMessage>;

@Schema({ collection: 'thread_messages', timestamps: false })
export class ThreadMessage {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  thread_id: string;

  @Prop({
    required: true,
    enum: ['ghost_tenant', 'ghost_landlord', 'platform_landlord'],
  })
  sender_type: ThreadMessageSenderType;

  @Prop({ required: true })
  sender_id: string;

  @Prop({ default: null })
  sender_name: string | null;

  @Prop({ required: true, maxlength: 4000 })
  body: string;

  @Prop({
    required: true,
    enum: ['web_form', 'email_reply', 'tokenised_page'],
  })
  source: ThreadMessageSource;

  @Prop({ required: true })
  sent_at: string;

  @Prop({ default: null })
  read_at: string | null;
}

export const ThreadMessageSchema = SchemaFactory.createForClass(ThreadMessage);

ThreadMessageSchema.index({ thread_id: 1, sent_at: 1 });
