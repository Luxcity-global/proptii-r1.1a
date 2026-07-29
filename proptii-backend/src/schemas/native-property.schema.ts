import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ _id: false })
export class NativePropertyPhoto {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ default: false })
  isCover: boolean;

  @Prop()
  room?: string;
}
export const NativePropertyPhotoSchema = SchemaFactory.createForClass(NativePropertyPhoto);

@Schema({ _id: false })
export class NativePropertyDocument {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  status: string;
}
export const NativePropertyDocSchema = SchemaFactory.createForClass(NativePropertyDocument);

@Schema({ collection: 'native_properties' })
export class NativeProperty extends Document {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  address: string;

  @Prop()
  city?: string;

  @Prop()
  postcode?: string;

  @Prop({ required: true })
  price: string;

  @Prop()
  bedrooms?: number;

  @Prop()
  bathrooms?: number;

  @Prop()
  squareFootage?: number;

  @Prop()
  type?: string;

  @Prop([String])
  amenities: string[];

  @Prop()
  notes?: string;

  @Prop({ type: [NativePropertyPhotoSchema], default: [] })
  photos: NativePropertyPhoto[];

  @Prop({ type: [NativePropertyDocSchema], default: [] })
  documents: NativePropertyDocument[];

  @Prop({ enum: ['vacant', 'occupied', 'under-renovation'], default: 'vacant' })
  status: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop()
  ownerEmail?: string;

  @Prop({ index: true })
  landlordId?: string;

  @Prop()
  tenantId?: string;

  @Prop({ default: 'native' })
  source: string;

  @Prop({ required: true })
  createdAt: string;

  @Prop({ required: true })
  updatedAt: string;
}

export const NativePropertySchema = SchemaFactory.createForClass(NativeProperty);
NativePropertySchema.index({ title: 'text', address: 'text', city: 'text', notes: 'text' });
NativePropertySchema.index({ userId: 1, createdAt: -1 });
