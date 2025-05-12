import { BaseService } from './BaseService';
import { z } from 'zod';

// Viewing schema validation
const viewingSchema = z.object({
    id: z.string().optional(),
    propertyId: z.string(),
    userId: z.string(),
    scheduledDate: z.string(),
    status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).default('pending'),
    notes: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
});

export type Viewing = z.infer<typeof viewingSchema>;

export class ViewingService extends BaseService {
    constructor() {
        super('Viewings');
    }

    async create(viewingData: Omit<Viewing, 'id' | 'createdAt' | 'updatedAt'>): Promise<Viewing> {
        const validatedData = viewingSchema.parse({
            ...viewingData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        return super.create(validatedData);
    }

    async update(id: string, viewingData: Partial<Viewing>): Promise<Viewing> {
        const validatedData = viewingSchema.partial().parse({
            ...viewingData,
            updatedAt: new Date().toISOString()
        });

        return super.update(id, id, validatedData);
    }

    async getAll(): Promise<Viewing[]> {
        return this.query<Viewing>('SELECT * FROM c');
    }

    async getById(id: string): Promise<Viewing> {
        return super.getById<Viewing>(id, id);
    }

    async delete(id: string): Promise<void> {
        return super.delete(id, id);
    }

    async getByPropertyId(propertyId: string): Promise<Viewing[]> {
        const query = 'SELECT * FROM c WHERE c.propertyId = @propertyId';
        return this.query<Viewing>(query, [{ name: '@propertyId', value: propertyId }]);
    }

    async getByUserId(userId: string): Promise<Viewing[]> {
        const query = 'SELECT * FROM c WHERE c.userId = @userId';
        return this.query<Viewing>(query, [{ name: '@userId', value: userId }]);
    }
} 