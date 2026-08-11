import { Injectable, NotFoundException, ForbiddenException, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NativeProperty } from '../schemas/native-property.schema';
import * as crypto from 'crypto';
import { Firestore } from 'firebase-admin/firestore';

@Injectable()
export class NativePropertiesService {
  private readonly logger = new Logger(NativePropertiesService.name);

  constructor(
    @InjectModel(NativeProperty.name) private propertyModel: Model<NativeProperty>,
    @Inject('FIRESTORE') private readonly firestoreClient: Firestore | null,
  ) {}

  async create(data: any): Promise<NativeProperty> {
    const now = new Date().toISOString();
    const newProperty = new this.propertyModel({
      ...data,
      id: crypto.randomUUID(),
      source: 'native',
      amenities: data.amenities ?? [],
      photos: data.photos ?? [],
      documents: data.documents ?? [],
      status: data.status ?? 'vacant',
      createdAt: now,
      updatedAt: now,
    });
    return await newProperty.save();
  }

  async findAllByUser(userId?: string, email?: string): Promise<NativeProperty[]> {
    const conditions: any[] = [];
    if (userId) {
      conditions.push({ userId });
      conditions.push({ landlordId: userId });
    }
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      conditions.push({ ownerEmail: normalizedEmail });
    }

    if (conditions.length === 0) {
      return [];
    }

    try {
      return await this.propertyModel.find({ $or: conditions }).sort({ createdAt: -1 }).exec();
    } catch (error) {
      this.logger.error('Error fetching native properties from MongoDB (returning empty array fallback):', error);
      return [];
    }
  }

  async findAllByUserId(userId: string): Promise<NativeProperty[]> {
    return this.findAllByUser(userId);
  }

  /**
   * Public full-text search across all native (landlord-listed) properties.
   * Used by the tenant search flow in useSearchBackend.ts.
   *
   * Search strategy:
   *  1. MongoDB $text index (fast — covers title, address, city, notes fields).
   *  2. If text search returns 0 results (index not yet built or partial match),
   *     fall back to a case-insensitive regex across the same fields.
   *
   * Only returns properties with status = 'vacant' (available to rent).
   */
  async searchPublic(query: string, limit = 50): Promise<NativeProperty[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // --- Primary: $text index search (O(log n)) ---
    try {
      const textResults = await this.propertyModel
        .find(
          { $text: { $search: trimmed }, status: 'vacant' },
          { score: { $meta: 'textScore' } },
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .exec();

      if (textResults.length > 0) return textResults;
    } catch {
      // $text index may not exist yet — fall through to regex.
    }

    // --- Fallback: regex across key fields ---
    const pattern = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return this.propertyModel
      .find({
        status: 'vacant',
        $or: [
          { title: pattern },
          { address: pattern },
          { city: pattern },
          { postcode: pattern },
          { notes: pattern },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findById(id: string): Promise<NativeProperty | null> {
    return await this.propertyModel.findOne({ id }).exec();
  }

  async update(id: string, userId: string, updates: any): Promise<NativeProperty> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('Property not found');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException('Forbidden');
    }

    const updated = await this.propertyModel.findOneAndUpdate(
      { id },
      { ...updates, updatedAt: new Date().toISOString() },
      { new: true }
    ).exec();
    
    if (!updated) {
        throw new NotFoundException('Property not found');
    }
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundException('Property not found');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException('Forbidden');
    }
    await this.propertyModel.findOneAndDelete({ id }).exec();

    // Cascading decouple: set propertyId to null for associated tenants
    if (this.firestoreClient) {
      try {
        const tenantsRef = this.firestoreClient.collection('tenants');
        const snapshot = await tenantsRef.where('propertyId', '==', id).get();
        if (!snapshot.empty) {
          const batch = this.firestoreClient.batch();
          snapshot.docs.forEach((doc) => {
            batch.update(doc.ref, { propertyId: null });
          });
          await batch.commit();
          this.logger.log(`Decoupled ${snapshot.size} tenants from deleted property ${id}`);
        }
      } catch (error) {
        this.logger.error(`Error decoupling tenants for deleted property ${id}:`, error);
      }
    }
  }
}
