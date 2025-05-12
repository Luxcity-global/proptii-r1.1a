import { CosmosClient, Container, ItemDefinition, OperationInput, OperationResponse } from '@azure/cosmos';
import { AppError } from '../middleware/error-handling';
import { validateEnv } from '../config/environment';

export abstract class BaseService {
    protected container: Container;
    protected client: CosmosClient;

    constructor(containerName: string) {
        const config = validateEnv();
        this.client = new CosmosClient({
            endpoint: config.COSMOS_DB_CONNECTION_STRING,
            key: process.env.COSMOS_DB_KEY || ''
        });
        this.container = this.client.database(config.COSMOS_DB_DATABASE_NAME).container(containerName);
    }

    protected async create<T extends ItemDefinition>(item: T): Promise<T> {
        try {
            const { resource } = await this.container.items.create(item);
            return resource as unknown as T;
        } catch (error) {
            throw new AppError(500, 'Failed to create item', 'CREATE_ERROR');
        }
    }

    protected async getById<T extends ItemDefinition>(id: string, partitionKey: string): Promise<T> {
        try {
            const { resource } = await this.container.item(id, partitionKey).read();
            if (!resource) {
                throw new AppError(404, 'Item not found', 'NOT_FOUND');
            }
            return resource as unknown as T;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to get item', 'GET_ERROR');
        }
    }

    protected async update<T extends ItemDefinition>(id: string, partitionKey: string, item: Partial<T>): Promise<T> {
        try {
            const { resource } = await this.container.item(id, partitionKey).replace(item);
            return resource as unknown as T;
        } catch (error) {
            throw new AppError(500, 'Failed to update item', 'UPDATE_ERROR');
        }
    }

    protected async delete(id: string, partitionKey: string): Promise<void> {
        try {
            await this.container.item(id, partitionKey).delete();
        } catch (error) {
            throw new AppError(500, 'Failed to delete item', 'DELETE_ERROR');
        }
    }

    protected async softDelete<T extends ItemDefinition>(id: string, partitionKey: string): Promise<T> {
        try {
            const item = await this.getById<T>(id, partitionKey);
            const updatedItem = {
                ...item,
                isDeleted: true,
                deletedAt: new Date().toISOString()
            } as T;
            return this.update(id, partitionKey, updatedItem);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to soft delete item', 'SOFT_DELETE_ERROR');
        }
    }

    protected async batchCreate<T extends ItemDefinition>(items: T[]): Promise<T[]> {
        try {
            const operations: OperationInput[] = items.map(item => ({
                operationType: 'Create',
                resourceBody: item,
                id: item.id,
                partitionKey: item.id
            }));

            const response = await this.container.items.bulk(operations);
            return response.map(r => r.resourceBody as unknown as T);
        } catch (error) {
            throw new AppError(500, 'Failed to batch create items', 'BATCH_CREATE_ERROR');
        }
    }

    protected async batchUpdate<T extends ItemDefinition>(items: { id: string; partitionKey: string; item: Partial<T> }[]): Promise<T[]> {
        try {
            const operations: OperationInput[] = items.map(({ id, partitionKey, item }) => ({
                operationType: 'Replace',
                id,
                partitionKey,
                resourceBody: item
            }));

            const response = await this.container.items.bulk(operations);
            return response.map(r => r.resourceBody as unknown as T);
        } catch (error) {
            throw new AppError(500, 'Failed to batch update items', 'BATCH_UPDATE_ERROR');
        }
    }

    protected async batchDelete(items: { id: string; partitionKey: string }[]): Promise<void> {
        try {
            const operations: OperationInput[] = items.map(({ id, partitionKey }) => ({
                operationType: 'Delete',
                id,
                partitionKey,
                resourceBody: {} // Required by type but not used for delete
            }));

            await this.container.items.bulk(operations);
        } catch (error) {
            throw new AppError(500, 'Failed to batch delete items', 'BATCH_DELETE_ERROR');
        }
    }

    protected async batchSoftDelete<T extends ItemDefinition>(items: { id: string; partitionKey: string }[]): Promise<T[]> {
        try {
            const operations: OperationInput[] = await Promise.all(
                items.map(async ({ id, partitionKey }) => {
                    const item = await this.getById<T>(id, partitionKey);
                    return {
                        operationType: 'Replace',
                        id,
                        partitionKey,
                        resourceBody: {
                            ...item,
                            isDeleted: true,
                            deletedAt: new Date().toISOString()
                        }
                    };
                })
            );

            const response = await this.container.items.bulk(operations);
            return response.map(r => r.resourceBody as unknown as T);
        } catch (error) {
            throw new AppError(500, 'Failed to batch soft delete items', 'BATCH_SOFT_DELETE_ERROR');
        }
    }

    protected async query<T>(query: string, parameters: any[] = []): Promise<T[]> {
        try {
            const { resources } = await this.container.items.query({
                query,
                parameters
            }).fetchAll();
            return resources as T[];
        } catch (error) {
            throw new AppError(500, 'Failed to query items', 'QUERY_ERROR');
        }
    }
} 