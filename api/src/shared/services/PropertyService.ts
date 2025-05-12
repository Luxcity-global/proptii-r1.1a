import { BaseService } from './BaseService';
import { z } from 'zod';

// Property schema validation
const propertySchema = z.object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string(),
    price: z.number().positive(),
    location: z.object({
        address: z.string(),
        city: z.string(),
        postcode: z.string(),
        coordinates: z.object({
            latitude: z.number(),
            longitude: z.number()
        })
    }),
    features: z.array(z.string()),
    images: z.array(z.string().url()),
    status: z.enum(['available', 'sold', 'pending']).default('available'),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
});

export type Property = z.infer<typeof propertySchema>;

export class PropertyService extends BaseService {
    constructor() {
        super('Properties');
    }

    async create(propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> {
        const validatedData = propertySchema.parse({
            ...propertyData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        return super.create(validatedData);
    }

    async update(id: string, propertyData: Partial<Property>): Promise<Property> {
        const validatedData = propertySchema.partial().parse({
            ...propertyData,
            updatedAt: new Date().toISOString()
        });

        return super.update(id, id, validatedData);
    }

    async getAll(): Promise<Property[]> {
        return this.query<Property>('SELECT * FROM c');
    }

    async getById(id: string): Promise<Property> {
        return super.getById<Property>(id, id);
    }

    async delete(id: string): Promise<void> {
        return super.delete(id, id);
    }

    async search(query: string): Promise<Property[]> {
        const searchQuery = `
            SELECT * FROM c
            WHERE CONTAINS(c.title, @query, true)
            OR CONTAINS(c.description, @query, true)
            OR CONTAINS(c.location.address, @query, true)
            OR CONTAINS(c.location.city, @query, true)
            OR CONTAINS(c.location.postcode, @query, true)
        `;

        return this.query<Property>(searchQuery, [{ name: '@query', value: query }]);
    }
} 