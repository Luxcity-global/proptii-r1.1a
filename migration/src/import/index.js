const { CosmosClient } = require('@azure/cosmos');
const { logger } = require('../utils/logger');
const { getConfig } = require('../utils/config');
const { MigrationError, ErrorCodes, withRetry } = require('../utils/errorHandling');

// Optimal RU/s thresholds for different operations
const RU_THRESHOLDS = {
  BATCH_IMPORT: 50000,
  SINGLE_DOCUMENT: 100,
  QUERY: 20
};

async function calculateOptimalBatchSize(container, sampleDocuments) {
  try {
    // Test import with different batch sizes
    const testSizes = [100, 50, 25];
    let optimalSize = testSizes[0];
    let minRUPerDoc = Infinity;

    for (const batchSize of testSizes) {
      const testBatch = sampleDocuments.slice(0, batchSize);
      const operations = testBatch.map(doc => ({
        operationType: 'Create',
        resourceBody: doc
      }));

      const start = Date.now();
      const response = await container.items.bulk(operations);
      const duration = Date.now() - start;

      const totalRU = response.reduce((sum, r) => sum + r.requestCharge, 0);
      const ruPerDoc = totalRU / batchSize;

      if (ruPerDoc < minRUPerDoc) {
        minRUPerDoc = ruPerDoc;
        optimalSize = batchSize;
      }

      logger.info(`Batch size ${batchSize}: ${ruPerDoc.toFixed(2)} RU/doc`);
    }

    return {
      batchSize: optimalSize,
      estimatedRUPerDoc: minRUPerDoc
    };
  } catch (error) {
    logger.error('Error calculating optimal batch size:', error);
    return { batchSize: 100, estimatedRUPerDoc: 50 }; // Default values
  }
}

async function validateImportedData(container, documents) {
  const validationErrors = [];

  for (const doc of documents) {
    try {
      const { resource } = await container.item(doc.id, doc._partitionKey).read();

      // Verify all fields were imported correctly
      for (const [key, value] of Object.entries(doc)) {
        if (JSON.stringify(resource[key]) !== JSON.stringify(value)) {
          validationErrors.push({
            documentId: doc.id,
            field: key,
            expected: value,
            actual: resource[key]
          });
        }
      }
    } catch (error) {
      validationErrors.push({
        documentId: doc.id,
        error: `Failed to read document: ${error.message}`
      });
    }
  }

  return validationErrors;
}

async function importData(container, documents, options = {}) {
  const {
    validateData = true,
    retryAttempts = 3,
    progressCallback
  } = options;

  try {
    logger.info(`Starting import to container: ${container.id}`);
    logger.info(`Total documents to import: ${documents.length}`);

    // Calculate optimal batch size
    const { batchSize, estimatedRUPerDoc } = await calculateOptimalBatchSize(
      container,
      documents.slice(0, 100) // Use first 100 documents as sample
    );

    const batches = [];
    for (let i = 0; i < documents.length; i += batchSize) {
      batches.push(documents.slice(i, i + batchSize));
    }

    const results = {
      successful: [],
      failed: [],
      validationErrors: []
    };

    let importedCount = 0;
    for (const [index, batch] of batches.entries()) {
      try {
        const operations = batch.map(doc => ({
          operationType: 'Create',
          resourceBody: doc
        }));

        // Use retry mechanism for batch import
        const response = await withRetry(
          async () => container.items.bulk(operations),
          retryAttempts
        );

        // Process batch results
        response.forEach((result, i) => {
          if (result.statusCode === 201) {
            results.successful.push(batch[i].id);
          } else {
            results.failed.push({
              id: batch[i].id,
              error: result.errorMessage
            });
          }
        });

        importedCount += batch.length;

        // Report progress
        if (progressCallback) {
          progressCallback({
            processed: importedCount,
            total: documents.length,
            currentBatch: index + 1,
            totalBatches: batches.length
          });
        }

        logger.info(`Imported batch ${index + 1}/${batches.length}`, {
          successful: results.successful.length,
          failed: results.failed.length
        });
      } catch (error) {
        logger.error(`Error importing batch ${index + 1}:`, error);
        batch.forEach(doc => {
          results.failed.push({
            id: doc.id,
            error: error.message
          });
        });
      }
    }

    // Validate imported data if requested
    if (validateData && results.successful.length > 0) {
      const successfulDocs = documents.filter(doc =>
        results.successful.includes(doc.id)
      );
      results.validationErrors = await validateImportedData(
        container,
        successfulDocs
      );
    }

    return {
      success: results.failed.length === 0 && results.validationErrors.length === 0,
      summary: {
        total: documents.length,
        successful: results.successful.length,
        failed: results.failed.length,
        validationErrors: results.validationErrors.length
      },
      failed: results.failed,
      validationErrors: results.validationErrors
    };
  } catch (error) {
    throw new MigrationError(
      `Fatal error during import to ${container.id}`,
      ErrorCodes.IMPORT_ERROR,
      { error: error.message }
    );
  }
}

async function main() {
  try {
    const config = await getConfig();
    const client = new CosmosClient({
      endpoint: config.cosmosDb.endpoint,
      key: config.cosmosDb.key
    });

    const database = client.database(config.cosmosDb.databaseId);
    const containers = {
      Users: database.container('Users'),
      References: database.container('References'),
      Viewings: database.container('Viewings'),
      Contracts: database.container('Contracts'),
      Dashboard: database.container('Dashboard')
    };

    // TODO: Implement data loading logic
    for (const [name, container] of Object.entries(containers)) {
      const documents = []; // Load documents from export
      const count = await importData(container, documents);
      logger.info(`Successfully imported ${count} documents to ${name}`);
    }
  } catch (error) {
    logger.error(`Import failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  importData
}; 