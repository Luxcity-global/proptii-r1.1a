import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  title: string;
  price: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  description: string;
  imageUrls: string[];
  agent: {
    name: string;
    email?: string;
    phone?: string;
    website?: string;
  };
  source: string;
  url: string;
  scrapedAt: Date;
  metadata?: Record<string, any>;
}

const PropertySchema: Schema = new Schema({
  title: { type: String, required: true },
  price: { type: String, required: true },
  location: { type: String, required: true, index: true },
  bedrooms: { type: Number },
  bathrooms: { type: Number },
  description: { type: String },
  imageUrls: [{ type: String }],
  agent: {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    website: { type: String }
  },
  source: { type: String, required: true },
  url: { type: String, required: true, unique: true },
  scrapedAt: { type: Date, default: Date.now },
  metadata: { type: Object }
});

// Create text index for search
PropertySchema.index({ title: 'text', description: 'text', location: 'text' });

export default mongoose.model<IProperty>('Property', PropertySchema);
