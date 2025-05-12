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
    private client: CosmosClient;
    private database: Database;
    private metricsContainer: Container;

    constructor() {
        const config = validateEnv();
        this.client = new CosmosClient({
            endpoint: config.COSMOS_DB_CONNECTION_STRING,
            key: process.env.COSMOS_DB_KEY || ''
        });
        this.database = this.client.database(config.COSMOS_DB_DATABASE_NAME);
        this.metricsContainer = this.database.container('Metrics');
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
            throw new AppError(500, 'Failed to get resource metrics', 'METRICS_ERROR');
        }
    }
} 