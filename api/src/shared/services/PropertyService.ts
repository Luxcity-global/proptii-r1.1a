import { CosmosBaseService } from './CosmosBaseService';
import { z } from 'zod';
import { normalisePhone } from '../utils/phoneNormaliser';

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
    agent: z.object({
        name: z.string().optional(),
        company: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional()
    }).optional(),
    landlordId: z.string().optional(),
    /** E.164-normalised phone number derived from agent.phone. Undefined when normalisation fails. */
    phone: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
});

export type Property = z.infer<typeof propertySchema>;

/**
 * Attempts to normalise the agent.phone field on a raw property document to E.164.
 * Returns the document with a top-level `phone` field set to the E.164 string on
 * success, or `undefined` when the raw value is absent or cannot be parsed.
 */
function applyPhoneNormalisation<T extends Record<string, unknown>>(doc: T): T & { phone?: string } {
    const agentPhone = (doc as { agent?: { phone?: string } }).agent?.phone;
    if (!agentPhone) {
        return { ...doc, phone: undefined };
    }
    const result = normalisePhone(agentPhone, 'agent.phone');
    return { ...doc, phone: result.success ? result.e164 : undefined };
}

export class PropertyService extends CosmosBaseService {
    constructor() {
        super('Properties');
    }

    async createProperty(propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> {
        const validatedData = propertySchema.parse({
            ...propertyData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        return super.create(validatedData);
    }

    async updateProperty(id: string, propertyData: Partial<Property>): Promise<Property> {
        const existing = await this.getPropertyById(id);
        const merged = {
            ...existing,
            ...propertyData,
            updatedAt: new Date().toISOString(),
        };
        const validatedData = propertySchema.parse(merged);
        return super.update(id, id, validatedData);
    }

    async getAll(): Promise<Property[]> {
        const docs = await this.query<Record<string, unknown>>('SELECT * FROM c');
        return docs.map(applyPhoneNormalisation) as Property[];
    }

    async getPropertyById(id: string): Promise<Property> {
        const doc = await super.getById<Record<string, unknown>>(id, id);
        return applyPhoneNormalisation(doc) as Property;
    }

    async deleteProperty(id: string): Promise<void> {
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