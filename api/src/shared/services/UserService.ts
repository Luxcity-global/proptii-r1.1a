import { BaseService } from './BaseService';
import { z } from 'zod';

// User schema validation
const userSchema = z.object({
    id: z.string().optional(),
    email: z.string().email(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.enum(['user', 'admin']).default('user'),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
});

export type User = z.infer<typeof userSchema>;

export class UserService extends BaseService {
    constructor() {
        super('Users');
    }

    async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
        const validatedData = userSchema.parse({
            ...userData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        return super.create(validatedData);
    }

    async update(id: string, userData: Partial<User>): Promise<User> {
        const validatedData = userSchema.partial().parse({
            ...userData,
            updatedAt: new Date().toISOString()
        });

        return super.update(id, id, validatedData);
    }

    async getAll(): Promise<User[]> {
        return this.query<User>('SELECT * FROM c');
    }

    async getById(id: string): Promise<User> {
        return super.getById<User>(id, id);
    }

    async delete(id: string): Promise<void> {
        return super.delete(id, id);
    }
} 