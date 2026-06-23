import { BaseService } from './BaseService';
import { AppError } from '../middleware/error-handling';
import { NativePropertyModel, INativeProperty } from '../models/property.model';
import { getMongoConnection } from '../config/mongodb';

export class NativePropertyService extends BaseService {
    constructor() {
        super(NativePropertyModel);
    }

    // -------------------------------------------------------------------------
    // Create
    // -------------------------------------------------------------------------
    async createNativeProperty(
        data: Omit<INativeProperty, 'id' | 'source' | 'createdAt' | 'updatedAt'>,
    ): Promise<INativeProperty> {
        const now = new Date().toISOString();
        const property: INativeProperty = {
            ...data,
            id: crypto.randomUUID(),
            source: 'native',
            amenities: data.amenities ?? [],
            photos: data.photos ?? [],
            documents: data.documents ?? [],
            status: data.status ?? 'vacant',
            createdAt: now,
            updatedAt: now,
        };
        return this.create<INativeProperty>(property);
    }

    // -------------------------------------------------------------------------
    // Read
    // -------------------------------------------------------------------------
    async getNativePropertyById(id: string): Promise<INativeProperty | null> {
        try {
            return await this.findOne<INativeProperty>({ id });
        } catch {
            return null;
        }
    }

    async getNativePropertiesByUserId(userId: string): Promise<INativeProperty[]> {
        return this.find<INativeProperty>({ userId }, { createdAt: -1 });
    }

    // -------------------------------------------------------------------------
    // Update
    // -------------------------------------------------------------------------
    async updateNativeProperty(
        id: string,
        userId: string,
        updates: Partial<Omit<INativeProperty, 'id' | 'source' | 'createdAt' | 'userId'>>,
    ): Promise<INativeProperty> {
        // Ownership guard — landlordId update is allowed without userId check (claim flow)
        const onlyLandlordIdUpdate = Object.keys(updates).length === 1 && 'landlordId' in updates;
        if (!onlyLandlordIdUpdate) {
            const existing = await this.getNativePropertyById(id);
            if (!existing) throw new AppError(404, 'Property not found', 'NOT_FOUND');
            if (existing.userId !== userId) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
        }
        return this.update<INativeProperty>(id, { ...updates, updatedAt: new Date().toISOString() });
    }

    // Unchecked update used internally (claim flow — bypasses userId ownership check)
    async patchNativeProperty(
        id: string,
        updates: Partial<INativeProperty>,
    ): Promise<INativeProperty> {
        return this.update<INativeProperty>(id, { ...updates, updatedAt: new Date().toISOString() });
    }

    // -------------------------------------------------------------------------
    // Delete
    // -------------------------------------------------------------------------
    async deleteNativeProperty(id: string, userId: string): Promise<void> {
        const existing = await this.getNativePropertyById(id);
        if (!existing) throw new AppError(404, 'Property not found', 'NOT_FOUND');
        if (existing.userId !== userId) throw new AppError(403, 'Forbidden', 'FORBIDDEN');
        await this.delete(id);
    }

    // -------------------------------------------------------------------------
    // Search (MongoDB text index on title, address, city, notes)
    // -------------------------------------------------------------------------
    async searchNativeProperties(query: string, limit = 50): Promise<INativeProperty[]> {
        await getMongoConnection();
        try {
            return await NativePropertyModel
                .find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
                .sort({ score: { $meta: 'textScore' } })
                .limit(limit)
                .lean<INativeProperty[]>();
        } catch (error: any) {
            // Do not run the fallback regex scan if the error is a connection/timeout error
            if (error?.name === 'MongooseServerSelectionError' || error?.message?.includes('timeout')) {
                throw error;
            }
            // Fallback to regex if text index not yet built
            const rx = new RegExp(query, 'i');
            return await NativePropertyModel
                .find({ $or: [{ title: rx }, { address: rx }, { city: rx }] })
                .limit(limit)
                .lean<INativeProperty[]>();
        }
    }
}
