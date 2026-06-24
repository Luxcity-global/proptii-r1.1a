import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type MongoUserDocument = HydratedDocument<MongoUser>;

@Schema({ collection: 'Users', timestamps: false })
export class MongoUser {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: false })
  firstName?: string;

  @Prop({ required: false })
  lastName?: string;

  @Prop({ required: false })
  lastSeenAt?: string;

  @Prop({ required: false, index: true, sparse: true })
  ghostAccountId?: string;
}

export const MongoUserSchema = SchemaFactory.createForClass(MongoUser);
