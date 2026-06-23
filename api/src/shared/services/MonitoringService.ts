import { CosmosClient, Container, Database } from '@azure/cosmos';
import { validateEnv } from '../config/environment';
import { AppError } from '../middleware/error-handling';

interface PerformanceMetrics {
    ruConsumption: number;
    latency: number;
    throughput: number;
    timestamp: string;
}

interface OperationMetrics {
    successCount: number;
    errorCount: number;
    requestDistribution: {
        [operation: string]: number;
    };
}

interface ResourceMetrics {
    storageUsage: number;
    indexSize: number;
    partitionDistribution: {
        [partitionKey: string]: number;
    };
}

export class MonitoringService {
    private _client: CosmosClient | null = null;
    private _database: Database | null = null;
    private _metricsContainer: Container | null = null;

    private get metricsContainer(): Container {
        if (!this._metricsContainer) {
            const config = validateEnv();
            const endpoint = config.COSMOS_DB_CONNECTION_STRING ?? '';
            if (!endpoint) {
                throw new AppError(503, 'Cosmos DB is not configured', 'COSMOS_NOT_CONFIGURED');
            }
            this._client = new CosmosClient({ endpoint, key: process.env.COSMOS_DB_KEY || config.COSMOS_DB_KEY || '' });
            this._database = this._client.database(config.COSMOS_DB_DATABASE_NAME ?? '');
            this._metricsContainer = this._database.container('Metrics');
        }
        return this._metricsContainer;
    }

    async trackPerformanceMetrics(metrics: PerformanceMetrics): Promise<void> {
        try {
            await this.metricsContainer.items.create({
                type: 'performance',
                ...metrics,
                id: `perf_${Date.now()}`,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to track performance metrics', 'METRICS_ERROR');
        }
    }

    async trackOperationMetrics(metrics: OperationMetrics): Promise<void> {
        try {
            await this.metricsContainer.items.create({
                type: 'operation',
                ...metrics,
                id: `op_${Date.now()}`,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to track operation metrics', 'METRICS_ERROR');
        }
    }

    async trackResourceMetrics(metrics: ResourceMetrics): Promise<void> {
        try {
            await this.metricsContainer.items.create({
                type: 'resource',
                ...metrics,
                id: `res_${Date.now()}`,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to track resource metrics', 'METRICS_ERROR');
        }
    }

    async getPerformanceMetrics(startTime: string, endTime: string): Promise<PerformanceMetrics[]> {
        try {
            const query = `
                SELECT * FROM c 
                WHERE c.type = 'performance' 
                AND c.timestamp >= @startTime 
                AND c.timestamp <= @endTime
            `;
            const { resources } = await this.metricsContainer.items.query({
                query,
                parameters: [
                    { name: '@startTime', value: startTime },
                    { name: '@endTime', value: endTime }
                ]
            }).fetchAll();
            return resources as PerformanceMetrics[];
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to get performance metrics', 'METRICS_ERROR');
        }
    }

    async getOperationMetrics(startTime: string, endTime: string): Promise<OperationMetrics[]> {
        try {
            const query = `
                SELECT * FROM c 
                WHERE c.type = 'operation' 
                AND c.timestamp >= @startTime 
                AND c.timestamp <= @endTime
            `;
            const { resources } = await this.metricsContainer.items.query({
                query,
                parameters: [
                    { name: '@startTime', value: startTime },
                    { name: '@endTime', value: endTime }
                ]
            }).fetchAll();
            return resources as OperationMetrics[];
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to get operation metrics', 'METRICS_ERROR');
        }
    }

    async getResourceMetrics(startTime: string, endTime: string): Promise<ResourceMetrics[]> {
        try {
            const query = `
                SELECT * FROM c 
                WHERE c.type = 'resource' 
                AND c.timestamp >= @startTime 
                AND c.timestamp <= @endTime
            `;
            const { resources } = await this.metricsContainer.items.query({
                query,
                parameters: [
                    { name: '@startTime', value: startTime },
                    { name: '@endTime', value: endTime }
                ]
            }).fetchAll();
            return resources as ResourceMetrics[];
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to get resource metrics', 'METRICS_ERROR');
        }
    }
}
