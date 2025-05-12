const { logger } = require('./utils/logger');
const { getConfig } = require('./utils/config');
const { exportData } = require('./export');
const { transformCollection } = require('./transform');
const { importData } = require('./import');
const { CosmosClient } = require('@azure/cosmos');

async function initializeCosmosDB() {
    const config = await getConfig();
    const client = new CosmosClient({
        endpoint: config.cosmosDb.endpoint,
        key: config.cosmosDb.key
    });

    const database = client.database(config.cosmosDb.database);
    const containers = {};

    // Initialize containers
    for (const [name, id] of Object.entries(config.cosmosDb.containers)) {
        containers[name] = database.container(id);
    }

    return containers;
}

async function migrateCollection(collectionName, cosmosContainer, options = {}) {
    logger.info(`Starting migration for collection: ${collectionName}`);

    try {
        // Step 1: Export data from Firestore
        logger.info(`Exporting data from ${collectionName}`);
        const exportResult = await exportData(collectionName);

        if (!exportResult.success) {
            throw new Error(`Export failed for ${collectionName}`);
        }

        logger.info(`Export completed for ${collectionName}`, exportResult.summary);

        // Step 2: Transform data
        logger.info(`Transforming data for ${collectionName}`);
        const transformResult = await transformCollection(
            exportResult.data,
            collectionName
        );

        if (!transformResult.success) {
            throw new Error(`Transformation failed for ${collectionName}`);
        }

        logger.info(`Transformation completed for ${collectionName}`, transformResult.summary);

        // Step 3: Import to Cosmos DB
        logger.info(`Importing data to Cosmos DB container: ${cosmosContainer.id}`);
        const importResult = await importData(cosmosContainer, transformResult.data, {
            validateData: true,
            retryAttempts: 3,
            progressCallback: (progress) => {
                logger.info(`Import progress for ${collectionName}:`, progress);
            }
        });

        if (!importResult.success) {
            throw new Error(`Import failed for ${collectionName}`);
        }

        logger.info(`Import completed for ${collectionName}`, importResult.summary);

        return {
            success: true,
            summary: {
                exported: exportResult.summary,
                transformed: transformResult.summary,
                imported: importResult.summary
            },
            errors: {
                export: exportResult.failedDocuments,
                transform: transformResult.failedDocuments,
                import: importResult.failed,
                validation: importResult.validationErrors
            }
        };
    } catch (error) {
        logger.error(`Migration failed for ${collectionName}:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function runMigration() {
    try {
        // Initialize Cosmos DB containers
        const containers = await initializeCosmosDB();

        // Collections to migrate
        const collections = [
            { name: 'Users', container: containers.users },
            { name: 'Properties', container: containers.references },
            { name: 'ViewingRequests', container: containers.viewings }
        ];

        const results = {};

        // Migrate each collection
        for (const { name, container } of collections) {
            logger.info(`Starting migration for ${name}`);
            results[name] = await migrateCollection(name, container);
        }

        // Generate final report
        const summary = {
            startTime: new Date().toISOString(),
            collections: Object.entries(results).map(([name, result]) => ({
                name,
                success: result.success,
                summary: result.success ? result.summary : null,
                error: !result.success ? result.error : null
            }))
        };

        logger.info('Migration completed', summary);
        return summary;
    } catch (error) {
        logger.error('Migration failed:', error);
        throw error;
    }
}

// Run migration if called directly
if (require.main === module) {
    runMigration()
        .then(() => process.exit(0))
        .catch((error) => {
            logger.error('Fatal error during migration:', error);
            process.exit(1);
        });
}

module.exports = {
    runMigration,
    migrateCollection
}; 