import { Model, Document } from 'mongoose';
import { AppError } from '../middleware/error-handling';
import { getMongoConnection } from '../config/mongodb';

/**
 * Abstract base service providing common CRUD operations over a Mongoose model.
 * All communication services extend this class.
 */
export abstract class BaseService {
    protected model: Model<any>;

    constructor(model: Model<any>) {
        this.model = model;
        // Ensure the MongoDB connection is established (singleton — safe to call repeatedly)
        getMongoConnection().catch((err) => {
            console.error('[BaseService] MongoDB connection error:', err);
        });
    }

    protected async create<T extends Record<string, any>>(item: T): Promise<T> {
        try {
            await this.model.create(item as any);
            return item;
        } catch (error) {
            throw new AppError(500, 'Failed to create item', 'CREATE_ERROR');
        }
    }

    protected async getById<T>(id: string): Promise<T> {
        try {
            const doc = await this.model.findOne({ id }).lean<T>();
            if (!doc) {
                throw new AppError(404, 'Item not found', 'NOT_FOUND');
            }
            return doc;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to get item', 'GET_ERROR');
        }
    }

    protected async update<T>(id: string, item: Partial<T>): Promise<T> {
        try {
            const doc = await this.model
                .findOneAndUpdate({ id }, { $set: item }, { new: true })
                .lean<T>();
            if (!doc) {
                throw new AppError(404, 'Item not found', 'NOT_FOUND');
            }
            return doc;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to update item', 'UPDATE_ERROR');
        }
    }

    protected async delete(id: string): Promise<void> {
        try {
            await this.model.deleteOne({ id });
        } catch (error) {
            throw new AppError(500, 'Failed to delete item', 'DELETE_ERROR');
        }
    }

    protected async softDelete<T>(id: string): Promise<T> {
        try {
            const doc = await this.model
                .findOneAndUpdate(
                    { id },
                    { $set: { isDeleted: true, deletedAt: new Date().toISOString() } },
                    { new: true },
                )
                .lean<T>();
            if (!doc) {
                throw new AppError(404, 'Item not found', 'NOT_FOUND');
            }
            return doc;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to soft delete item', 'SOFT_DELETE_ERROR');
        }
    }

    protected async findOne<T>(filter: Record<string, unknown>): Promise<T | null> {
        try {
            return await this.model.findOne(filter).lean<T>();
        } catch (error) {
            throw new AppError(500, 'Failed to find item', 'QUERY_ERROR');
        }
    }

    protected async find<T>(
        filter: Record<string, unknown>,
        sort?: Record<string, 1 | -1>,
    ): Promise<T[]> {
        try {
            let query = this.model.find(filter);
            if (sort) query = query.sort(sort);
            return await query.lean<T[]>();
        } catch (error) {
            throw new AppError(500, 'Failed to query items', 'QUERY_ERROR');
        }
    }

    protected async countDocuments(filter: Record<string, unknown>): Promise<number> {
        try {
            return await this.model.countDocuments(filter);
        } catch (error) {
            throw new AppError(500, 'Failed to count items', 'QUERY_ERROR');
        }
    }
}
