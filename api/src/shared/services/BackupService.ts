import { CosmosClient, Database, Container } from '@azure/cosmos';
import { validateEnv } from '../config/environment';
import { AppError } from '../middleware/error-handling';

interface BackupConfig {
    frequency: 'hourly' | 'daily' | 'weekly';
    retentionPeriod: number; // in days
    consistencyLevel: 'Strong' | 'BoundedStaleness' | 'Session' | 'Eventual';
    pointInTimeRetention: number; // in hours
}

interface BackupMetadata {
    id: string;
    timestamp: string;
    containerName: string;
    itemCount: number;
    size: number;
    status: 'completed' | 'failed' | 'in_progress';
    error?: string;
    changeFeedToken?: string; // For point-in-time recovery
}

interface PointInTimeRecoveryConfig {
    targetTimestamp: string;
    targetContainerName: string;
    includeDeleted?: boolean;
}

export class BackupService {
    private client: CosmosClient;
    private database: Database;
    private backupContainer: Container;
    private config: BackupConfig;

    constructor(config: BackupConfig) {
        const envConfig = validateEnv();
        this.client = new CosmosClient({
            endpoint: envConfig.COSMOS_DB_CONNECTION_STRING,
            key: process.env.COSMOS_DB_KEY || ''
        });
        this.database = this.client.database(envConfig.COSMOS_DB_DATABASE_NAME);
        this.backupContainer = this.database.container('Backups');
        this.config = config;
    }

    async createBackup(containerName: string): Promise<BackupMetadata> {
        try {
            const container = this.database.container(containerName);
            const { resources } = await container.items.query({
                query: 'SELECT * FROM c',
                parameters: []
            }).fetchAll();

            const backupId = `backup_${Date.now()}`;
            const backupMetadata: BackupMetadata = {
                id: backupId,
                timestamp: new Date().toISOString(),
                containerName,
                itemCount: resources.length,
                size: JSON.stringify(resources).length,
                status: 'in_progress'
            };

            // Store backup metadata
            await this.backupContainer.items.create(backupMetadata);

            // Store actual backup data
            await this.backupContainer.items.create({
                id: `${backupId}_data`,
                type: 'backup_data',
                containerName,
                data: resources,
                timestamp: backupMetadata.timestamp
            });

            // Update metadata status
            backupMetadata.status = 'completed';
            await this.backupContainer.item(backupId).replace(backupMetadata);

            return backupMetadata;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new AppError(500, `Failed to create backup: ${errorMessage}`, 'BACKUP_ERROR');
        }
    }

    async restoreBackup(backupId: string, targetContainerName: string): Promise<void> {
        try {
            // Get backup data
            const { resource: backupData } = await this.backupContainer.item(`${backupId}_data`).read();
            if (!backupData) {
                throw new AppError(404, 'Backup data not found', 'BACKUP_NOT_FOUND');
            }

            const targetContainer = this.database.container(targetContainerName);

            // Restore data in batches
            const batchSize = 100;
            for (let i = 0; i < backupData.data.length; i += batchSize) {
                const batch = backupData.data.slice(i, i + batchSize);
                const operations = batch.map(item => ({
                    operationType: 'Create',
                    resourceBody: item,
                    id: item.id,
                    partitionKey: item.id
                }));

                await targetContainer.items.bulk(operations);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new AppError(500, `Failed to restore backup: ${errorMessage}`, 'RESTORE_ERROR');
        }
    }

    async listBackups(containerName?: string): Promise<BackupMetadata[]> {
        try {
            let query = 'SELECT * FROM c WHERE c.type = "backup_metadata"';
            const parameters = [];

            if (containerName) {
                query += ' AND c.containerName = @containerName';
                parameters.push({ name: '@containerName', value: containerName });
            }

            const { resources } = await this.backupContainer.items.query({
                query,
                parameters
            }).fetchAll();

            return resources as BackupMetadata[];
        } catch (error) {
            throw new AppError(500, 'Failed to list backups', 'BACKUP_LIST_ERROR');
        }
    }

    async deleteOldBackups(): Promise<void> {
        try {
            const retentionDate = new Date();
            retentionDate.setDate(retentionDate.getDate() - this.config.retentionPeriod);

            const query = `
                SELECT * FROM c 
                WHERE c.type = "backup_metadata" 
                AND c.timestamp < @retentionDate
            `;

            const { resources } = await this.backupContainer.items.query({
                query,
                parameters: [{ name: '@retentionDate', value: retentionDate.toISOString() }]
            }).fetchAll();

            // Delete backup data and metadata
            for (const backup of resources) {
                await this.backupContainer.item(`${backup.id}_data`).delete();
                await this.backupContainer.item(backup.id).delete();
            }
        } catch (error) {
            throw new AppError(500, 'Failed to delete old backups', 'BACKUP_DELETE_ERROR');
        }
    }

    async getBackupStatus(backupId: string): Promise<BackupMetadata> {
        try {
            const { resource } = await this.backupContainer.item(backupId).read();
            if (!resource) {
                throw new AppError(404, 'Backup not found', 'BACKUP_NOT_FOUND');
            }
            return resource as BackupMetadata;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to get backup status', 'BACKUP_STATUS_ERROR');
        }
    }

    async restoreToPointInTime(config: PointInTimeRecoveryConfig): Promise<void> {
        try {
            // Find the closest backup before the target timestamp
            const query = `
                SELECT TOP 1 * FROM c 
                WHERE c.containerName = @containerName 
                AND c.timestamp <= @targetTimestamp 
                AND c.status = 'completed'
                ORDER BY c.timestamp DESC
            `;

            const { resources } = await this.backupContainer.items.query({
                query,
                parameters: [
                    { name: '@containerName', value: config.targetContainerName },
                    { name: '@targetTimestamp', value: config.targetTimestamp }
                ]
            }).fetchAll();

            if (!resources.length) {
                throw new AppError(404, 'No suitable backup found for point-in-time recovery', 'BACKUP_NOT_FOUND');
            }

            const backup = resources[0] as BackupMetadata;
            const targetContainer = this.database.container(config.targetContainerName);

            // Get the change feed from the backup timestamp to the target timestamp
            const changeFeed = await this.getChangeFeed(
                config.targetContainerName,
                backup.timestamp,
                config.targetTimestamp
            );

            // First restore the backup
            await this.restoreBackup(backup.id, config.targetContainerName);

            // Then apply the change feed
            for (const change of changeFeed) {
                if (change.operationType === 'create' || change.operationType === 'update') {
                    await targetContainer.item(change.id).replace(change.resourceBody);
                } else if (change.operationType === 'delete' && config.includeDeleted) {
                    await targetContainer.item(change.id).delete();
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new AppError(500, `Failed to restore to point in time: ${errorMessage}`, 'POINT_IN_TIME_RESTORE_ERROR');
        }
    }

    private async getChangeFeed(
        containerName: string,
        startTime: string,
        endTime: string
    ): Promise<Array<{ operationType: string; id: string; resourceBody: any }>> {
        try {
            const container = this.database.container(containerName);
            const changes: Array<{ operationType: string; id: string; resourceBody: any }> = [];

            // Get all items modified between start and end time
            const query = `
                SELECT * FROM c 
                WHERE c._ts >= @startTimestamp 
                AND c._ts <= @endTimestamp
            `;

            const { resources } = await container.items.query({
                query,
                parameters: [
                    { name: '@startTimestamp', value: new Date(startTime).getTime() / 1000 },
                    { name: '@endTimestamp', value: new Date(endTime).getTime() / 1000 }
                ]
            }).fetchAll();

            // Process each change
            for (const resource of resources) {
                changes.push({
                    operationType: resource._deleted ? 'delete' : 'update',
                    id: resource.id,
                    resourceBody: resource
                });
            }

            return changes;
        } catch (error) {
            throw new AppError(500, 'Failed to get change feed', 'CHANGE_FEED_ERROR');
        }
    }

    async getPointInTimeRecoveryPoints(containerName: string): Promise<Array<{ timestamp: string; backupId: string }>> {
        try {
            const query = `
                SELECT c.id, c.timestamp 
                FROM c 
                WHERE c.containerName = @containerName 
                AND c.status = 'completed'
                ORDER BY c.timestamp DESC
            `;

            const { resources } = await this.backupContainer.items.query({
                query,
                parameters: [{ name: '@containerName', value: containerName }]
            }).fetchAll();

            return resources.map((r: any) => ({
                timestamp: r.timestamp,
                backupId: r.id
            }));
        } catch (error) {
            throw new AppError(500, 'Failed to get recovery points', 'RECOVERY_POINTS_ERROR');
        }
    }
} 