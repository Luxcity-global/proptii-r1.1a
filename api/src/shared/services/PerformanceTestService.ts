import { CosmosClient, Container, Database } from '@azure/cosmos';
import { validateEnv } from '../config/environment';
import { AppError } from '../middleware/error-handling';
import { MonitoringService } from './MonitoringService';

interface TestResult {
    id: string;
    testName: string;
    startTime: string;
    endTime: string;
    duration: number;
    operations: number;
    successCount: number;
    errorCount: number;
    averageLatency: number;
    maxLatency: number;
    minLatency: number;
    ruConsumption: number;
}

interface TestConfig {
    duration: number; // Test duration in seconds
    concurrency: number; // Number of concurrent operations
    operationType: 'read' | 'write' | 'query' | 'mixed';
    batchSize?: number; // For batch operations
}

export class PerformanceTestService {
    private client: CosmosClient;
    private database: Database;
    private testContainer: Container;
    private monitoringService: MonitoringService;

    constructor() {
        const config = validateEnv();
        this.client = new CosmosClient({
            endpoint: config.COSMOS_DB_CONNECTION_STRING,
            key: process.env.COSMOS_DB_KEY || ''
        });
        this.database = this.client.database(config.COSMOS_DB_DATABASE_NAME);
        this.testContainer = this.database.container('PerformanceTests');
        this.monitoringService = new MonitoringService();
    }

    async runTest(testName: string, config: TestConfig): Promise<TestResult> {
        const startTime = Date.now();
        const latencies: number[] = [];
        let operations = 0;
        let successCount = 0;
        let errorCount = 0;
        let totalRuConsumption = 0;

        try {
            const endTime = startTime + (config.duration * 1000);
            const promises: Promise<void>[] = [];

            while (Date.now() < endTime) {
                for (let i = 0; i < config.concurrency; i++) {
                    promises.push(this.executeOperation(config, latencies, {
                        operations,
                        successCount,
                        errorCount,
                        totalRuConsumption
                    }));
                }

                await Promise.all(promises);
                operations += config.concurrency;
            }

            const result: TestResult = {
                id: `test_${Date.now()}`,
                testName,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date().toISOString(),
                duration: config.duration,
                operations,
                successCount,
                errorCount,
                averageLatency: this.calculateAverageLatency(latencies),
                maxLatency: Math.max(...latencies),
                minLatency: Math.min(...latencies),
                ruConsumption: totalRuConsumption
            };

            await this.testContainer.items.create(result);
            await this.monitoringService.trackPerformanceMetrics({
                ruConsumption: totalRuConsumption,
                latency: result.averageLatency,
                throughput: operations / config.duration,
                timestamp: new Date().toISOString()
            });

            return result;
        } catch (error) {
            throw new AppError(500, 'Failed to run performance test', 'PERFORMANCE_TEST_ERROR');
        }
    }

    private async executeOperation(
        config: TestConfig,
        latencies: number[],
        stats: { operations: number; successCount: number; errorCount: number; totalRuConsumption: number }
    ): Promise<void> {
        const startTime = Date.now();
        try {
            switch (config.operationType) {
                case 'read':
                    await this.executeReadOperation();
                    break;
                case 'write':
                    await this.executeWriteOperation();
                    break;
                case 'query':
                    await this.executeQueryOperation();
                    break;
                case 'mixed':
                    await this.executeMixedOperation();
                    break;
            }

            const latency = Date.now() - startTime;
            latencies.push(latency);
            stats.successCount++;
        } catch (error) {
            stats.errorCount++;
        }
    }

    private async executeReadOperation(): Promise<void> {
        const { resource } = await this.testContainer.items.query({
            query: 'SELECT TOP 1 * FROM c'
        }).fetchNext();
    }

    private async executeWriteOperation(): Promise<void> {
        await this.testContainer.items.create({
            id: `test_${Date.now()}`,
            timestamp: new Date().toISOString()
        });
    }

    private async executeQueryOperation(): Promise<void> {
        await this.testContainer.items.query({
            query: 'SELECT * FROM c WHERE c.timestamp > @timestamp',
            parameters: [{ name: '@timestamp', value: new Date(Date.now() - 3600000).toISOString() }]
        }).fetchAll();
    }

    private async executeMixedOperation(): Promise<void> {
        const operations = [
            this.executeReadOperation(),
            this.executeWriteOperation(),
            this.executeQueryOperation()
        ];
        await Promise.all(operations);
    }

    private calculateAverageLatency(latencies: number[]): number {
        return latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length;
    }

    async getTestResults(testName?: string): Promise<TestResult[]> {
        try {
            let query = 'SELECT * FROM c';
            const parameters = [];

            if (testName) {
                query += ' WHERE c.testName = @testName';
                parameters.push({ name: '@testName', value: testName });
            }

            const { resources } = await this.testContainer.items.query({
                query,
                parameters
            }).fetchAll();

            return resources as TestResult[];
        } catch (error) {
            throw new AppError(500, 'Failed to get test results', 'TEST_RESULTS_ERROR');
        }
    }

    async compareTestResults(testId1: string, testId2: string): Promise<{
        latencyDiff: number;
        throughputDiff: number;
        ruConsumptionDiff: number;
    }> {
        try {
            const [result1, result2] = await Promise.all([
                this.testContainer.item(testId1).read(),
                this.testContainer.item(testId2).read()
            ]);

            if (!result1.resource || !result2.resource) {
                throw new AppError(404, 'Test results not found', 'TEST_RESULTS_NOT_FOUND');
            }

            return {
                latencyDiff: result1.resource.averageLatency - result2.resource.averageLatency,
                throughputDiff: (result1.resource.operations / result1.resource.duration) -
                    (result2.resource.operations / result2.resource.duration),
                ruConsumptionDiff: result1.resource.ruConsumption - result2.resource.ruConsumption
            };
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to compare test results', 'TEST_COMPARISON_ERROR');
        }
    }
} 