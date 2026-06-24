import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type EnquiryThreadStatus = 'open' | 'replied' | 'closed' | 'archived';

export type QuickRequestCategory =
  | 'Book Viewing'
  | 'Property Price'
  | 'Availability'
  | 'Mortgage Info'
  | 'Neighbourhood Info'
  | 'Other';

export type EnquiryThreadDocument = HydratedDocument<EnquiryThread>;

@Schema({ collection: 'enquiry_threads', timestamps: false })
export class EnquiryThread {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, index: true })
  listing_id: string;

  @Prop({ required: true, enum: ['native', 'scraped'] })
  listing_source: 'native' | 'scraped';

  @Prop({ default: null })
  listing_title: string | null;

  @Prop({ required: true, index: true })
  ghost_tenant_id: string;

  @Prop({ default: null })
  ghost_tenant_name: string | null;

  @Prop({ required: true, index: true })
  landlord_id: string;

  @Prop({ required: true, unique: true, index: true })
  thread_token: string;

  @Prop({ required: true })
  relay_email: string;

  @Prop({
    type: [String],
    enum: [
      'Book Viewing',
      'Property Price',
      'Availability',
      'Mortgage Info',
      'Neighbourhood Info',
      'Other',
    ],
    default: [],
  })
  categories: QuickRequestCategory[];

  @Prop({ required: true, enum: ['open', 'replied', 'closed', 'archived'], default: 'open' })
  status: EnquiryThreadStatus;

  @Prop({ required: true, default: 0 })
  message_count: number;

  @Prop({ required: true })
  created_at: string;

  @Prop({ default: null })
  last_reply_at: string | null;
}

export const EnquiryThreadSchema = SchemaFactory.createForClass(EnquiryThread);

EnquiryThreadSchema.index({ ghost_tenant_id: 1, created_at: -1 });
EnquiryThreadSchema.index({ landlord_id: 1, last_reply_at: -1 });
