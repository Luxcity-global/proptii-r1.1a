const { CosmosClient } = require('@azure/cosmos');
const { logger } = require('../utils/logger');
const { getConfig } = require('../utils/config');

async function importData(container, documents, batchSize = 100) {
  try {
    logger.info(`Starting import to container: ${container.id}`);
    logger.info(`Total documents to import: ${documents.length}`);
    
    const batches = [];
    for (let i = 0; i < documents.length; i += batchSize) {
      batches.push(documents.slice(i, i + batchSize));
    }
    
    let importedCount = 0;
    for (const batch of batches) {
      const operations = batch.map(doc => ({
        operationType: 'Create',
        resourceBody: doc
      }));
      
      await container.items.bulk(operations);
      importedCount += batch.length;
      logger.info(`Imported ${importedCount}/${documents.length} documents`);
    }
    
    return importedCount;
  } catch (error) {
    logger.error(`Error importing to ${container.id}: ${error.message}`);
    throw error;
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