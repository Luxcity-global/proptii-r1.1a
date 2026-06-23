/**
 * CosmosBaseService — the original Cosmos DB base service.
 * Used by PropertyService, UserService, ViewingService, and MonitoringService.
 * The communication feature uses BaseService (MongoDB) instead.
 */
import { CosmosClient, Container, OperationInput } from '@azure/cosmos';
import { AppError } from '../middleware/error-handling';
import { validateEnv } from '../config/environment';

export abstract class CosmosBaseService {
    protected container!: Container;
    protected client!: CosmosClient;
    private _containerName: string;
    private _initialized = false;

    constructor(containerName: string) {
        // Store the container name but do NOT construct CosmosClient here.
        // Constructing it eagerly with an empty endpoint throws "Invalid URL"
        // and crashes the entire Azure Functions worker on startup when
        // COSMOS_DB_CONNECTION_STRING is not set (e.g. local dev without Cosmos).
        this._containerName = containerName;
    }

    /** Lazily initialise the Cosmos client on first use. */
    private ensureInitialized(): void {
        if (this._initialized) return;
        const config = validateEnv();
        const endpoint = config.COSMOS_DB_CONNECTION_STRING ?? '';
        const key = process.env.COSMOS_DB_KEY || config.COSMOS_DB_KEY || '';
        if (!endpoint) {
            throw new AppError(503, 'Cosmos DB is not configured in this environment', 'COSMOS_NOT_CONFIGURED');
        }
        this.client = new CosmosClient({ endpoint, key });
        this.container = this.client
            .database(config.COSMOS_DB_DATABASE_NAME ?? '')
            .container(this._containerName);
        this._initialized = true;
    }

    protected async create<T>(item: T): Promise<T> {
        this.ensureInitialized();
        try {
            const { resource } = await this.container.items.create(item as any);
            return resource as T;
        } catch (error) {
            throw new AppError(500, 'Failed to create item', 'CREATE_ERROR');
        }
    }

    protected async getById<T>(id: string, partitionKey: string): Promise<T> {
        this.ensureInitialized();
        try {
            const { resource } = await this.container.item(id, partitionKey).read();
            if (!resource) throw new AppError(404, 'Item not found', 'NOT_FOUND');
            return resource as T;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to get item', 'GET_ERROR');
        }
    }

    protected async update<T>(id: string, partitionKey: string, item: Partial<T>): Promise<T> {
        this.ensureInitialized();
        try {
            const { resource } = await this.container.item(id, partitionKey).replace(item as any);
            return resource as T;
        } catch (error) {
            throw new AppError(500, 'Failed to update item', 'UPDATE_ERROR');
        }
    }

    protected async delete(id: string, partitionKey: string): Promise<void> {
        this.ensureInitialized();
        try {
            await this.container.item(id, partitionKey).delete();
        } catch (error) {
            throw new AppError(500, 'Failed to delete item', 'DELETE_ERROR');
        }
    }

    protected async softDelete<T>(id: string, partitionKey: string): Promise<T> {
        try {
            const item = await this.getById<T>(id, partitionKey);
            const updatedItem = { ...item, isDeleted: true, deletedAt: new Date().toISOString() } as T;
            return this.update(id, partitionKey, updatedItem);
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to soft delete item', 'SOFT_DELETE_ERROR');
        }
    }

    protected async query<T>(query: string, parameters: any[] = []): Promise<T[]> {
        this.ensureInitialized();
        try {
            const { resources } = await this.container.items.query({ query, parameters }).fetchAll();
            return resources as T[];
        } catch (error) {
            throw new AppError(500, 'Failed to query items', 'QUERY_ERROR');
        }
    }
}
