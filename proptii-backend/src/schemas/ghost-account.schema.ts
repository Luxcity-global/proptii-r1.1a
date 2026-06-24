import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type GhostAccountRole = 'ghost_tenant' | 'ghost_landlord';
export type GhostAccountStatus = 'ghost' | 'claim_email_sent' | 'claimed';
export type SourcePlatform = 'onthemove' | 'rightmarket' | 'direct' | null;

export type GhostAccountDocument = HydratedDocument<GhostAccount>;

@Schema({ collection: 'ghost_accounts', timestamps: false })
export class GhostAccount {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ default: null, index: true, sparse: true })
  email: string | null;

  @Prop({ default: null })
  name: string | null;

  @Prop({ required: true, enum: ['ghost_tenant', 'ghost_landlord'] })
  role: GhostAccountRole;

  @Prop({ required: true, enum: ['ghost', 'claim_email_sent', 'claimed'], default: 'ghost' })
  status: GhostAccountStatus;

  @Prop({ default: null, enum: ['onthemove', 'rightmarket', 'direct', null] })
  source_platform: SourcePlatform;

  @Prop({ default: null, index: true, sparse: true })
  claim_token: string | null;

  @Prop({ default: null })
  claim_token_expires_at: string | null;

  @Prop({ default: null })
  claimed_at: string | null;

  @Prop({ default: null, index: true, sparse: true })
  linked_user_id: string | null;

  @Prop({ required: true })
  created_at: string;
}

export const GhostAccountSchema = SchemaFactory.createForClass(GhostAccount);

// Compound index: look up unclaimed ghost tenant by email
GhostAccountSchema.index({ email: 1, role: 1, status: 1 });
