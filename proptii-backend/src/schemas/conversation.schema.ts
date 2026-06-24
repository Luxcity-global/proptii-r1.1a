import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ collection: 'conversations', timestamps: false })
export class Conversation {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  propertyId: string;

  @Prop({ required: true, index: true })
  tenantId: string;

  @Prop({ required: true })
  landlordId: string;

  @Prop({ required: true })
  createdAt: string;

  @Prop({ required: true })
  updatedAt: string;

  @Prop({ default: null })
  lastMessageAt: string | null;

  @Prop({ required: true, default: false })
  isDeleted: boolean;

  @Prop({ default: null })
  deletedAt: string | null;

  @Prop({ required: false })
  propertyTitle?: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index({ propertyId: 1, tenantId: 1, landlordId: 1 }, { unique: true });
