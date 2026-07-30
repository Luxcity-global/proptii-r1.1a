import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NativeProperty } from '../schemas/native-property.schema';
import * as crypto from 'crypto';

@Injectable()
export class NativePropertiesService {
  constructor(
    @InjectModel(NativeProperty.name) private propertyModel: Model<NativeProperty>,
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

    return await this.propertyModel.find({ $or: conditions }).sort({ createdAt: -1 }).exec();
  }

  async findAllByUserId(userId: string): Promise<NativeProperty[]> {
    return this.findAllByUser(userId);
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
  }
}
