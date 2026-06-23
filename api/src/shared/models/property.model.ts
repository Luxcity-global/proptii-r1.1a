import mongoose, { Schema, Document, Model } from 'mongoose';

// ---------------------------------------------------------------------------
// Native Property — landlord-listed properties created directly on Proptii
// ---------------------------------------------------------------------------

export interface INativePropertyPhoto {
  id: string;
  url: string;
  filename: string;
  isCover: boolean;
  room?: string;
}

export interface INativePropertyDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  status: string;
}

export interface INativeProperty {
  id: string;
  title: string;
  address: string;
  city?: string;
  postcode?: string;
  price: string;          // e.g. "£1,800 pcm"
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  type?: string;          // flat, house, studio, etc.
  amenities: string[];
  notes?: string;
  photos: INativePropertyPhoto[];
  documents: INativePropertyDocument[];
  status: 'vacant' | 'occupied' | 'under-renovation';
  /** B2C user ID of the landlord/agent who created the listing */
  userId: string;
  /** Email of the owner — used for identity verification */
  ownerEmail?: string;
  /** Set once the landlord has a Proptii account and is linked */
  landlordId?: string;
  /** Tenant currently assigned to this property */
  tenantId?: string;
  source: 'native';
  createdAt: string;
  updatedAt: string;
}

export type NativePropertyDocument = INativeProperty & Document;

const NativePropertyPhotoSchema = new Schema({
  id:       { type: String, required: true },
  url:      { type: String, required: true },
  filename: { type: String, required: true },
  isCover:  { type: Boolean, default: false },
  room:     { type: String },
}, { _id: false });

const NativePropertyDocumentSchema = new Schema({
  id:     { type: String, required: true },
  name:   { type: String, required: true },
  type:   { type: String, required: true },
  url:    { type: String, required: true },
  status: { type: String, required: true },
}, { _id: false });

const NativePropertySchema = new Schema<NativePropertyDocument>({
  id:           { type: String, required: true, unique: true },
  title:        { type: String, required: true },
  address:      { type: String, required: true },
  city:         { type: String },
  postcode:     { type: String },
  price:        { type: String, required: true },
  bedrooms:     { type: Number },
  bathrooms:    { type: Number },
  squareFootage:{ type: Number },
  type:         { type: String },
  amenities:    [{ type: String }],
  notes:        { type: String },
  photos:       [NativePropertyPhotoSchema],
  documents:    [NativePropertyDocumentSchema],
  status:       { type: String, enum: ['vacant', 'occupied', 'under-renovation'], default: 'vacant' },
  userId:       { type: String, required: true, index: true },
  ownerEmail:   { type: String },
  landlordId:   { type: String, index: true },
  tenantId:     { type: String },
  source:       { type: String, default: 'native' },
  createdAt:    { type: String, required: true },
  updatedAt:    { type: String, required: true },
}, { collection: 'native_properties' });

NativePropertySchema.index({ title: 'text', address: 'text', city: 'text', notes: 'text' });
NativePropertySchema.index({ userId: 1, createdAt: -1 });

export const NativePropertyModel: Model<NativePropertyDocument> =
  mongoose.models.NativeProperty ||
  mongoose.model<NativePropertyDocument>('NativeProperty', NativePropertySchema);

// ---------------------------------------------------------------------------
// Scraped Property — read-only reference model (written by proptii-search)
// This model is READ ONLY from the API side; proptii-search owns writes.
// ---------------------------------------------------------------------------

export interface IScrapedProperty {
  _id?: any;
  title: string;
  price: string;
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  description?: string;
  imageUrls: string[];
  agent?: {
    name?: string;
    email?: string;
    phone?: string;
    website?: string;
  };
  source: string;
  url: string;
  scrapedAt: Date;
  landlordId?: string | null;
  metadata?: Record<string, any>;
}

export type ScrapedPropertyDocument = IScrapedProperty & Document;

const ScrapedPropertySchema = new Schema<ScrapedPropertyDocument>({
  title:       { type: String },
  price:       { type: String },
  location:    { type: String },
  bedrooms:    { type: Number },
  bathrooms:   { type: Number },
  description: { type: String },
  imageUrls:   [{ type: String }],
  agent: {
    name:    { type: String },
    email:   { type: String },
    phone:   { type: String },
    website: { type: String },
  },
  source:     { type: String },
  url:        { type: String },
  scrapedAt:  { type: Date },
  landlordId: { type: String, default: null },
  metadata:   { type: Object },
}, { collection: 'scraped_properties' });

export const ScrapedPropertyModel: Model<ScrapedPropertyDocument> =
  mongoose.models.ScrapedProperty ||
  mongoose.model<ScrapedPropertyDocument>('ScrapedProperty', ScrapedPropertySchema);
