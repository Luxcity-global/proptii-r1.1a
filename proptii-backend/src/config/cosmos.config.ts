import { CosmosClient } from '@azure/cosmos';
import { Logger } from '@nestjs/common';

const logger = new Logger('CosmosConfig');

export interface CosmosConfig {
  endpoint: string;
  key: string;
  databaseId: string;
  containers: {
    properties: string;
    agents: string;
    viewings: string;
    users: string;
    references: string;
    contracts: string;
    dashboard: string;
  };
}

export const cosmosConfig: CosmosConfig = {
  endpoint: process.env.COSMOS_DB_CONNECTION_STRING || '',
  key: process.env.COSMOS_DB_KEY || '',
  databaseId: process.env.COSMOS_DB_DATABASE_NAME || 'proptii-db',
  containers: {
    properties: 'Properties',
    agents: 'Agents',
    viewings: 'Viewings',
    users: 'Users',
    references: 'References',
    contracts: 'Contracts',
    dashboard: 'Dashboard'
  }
};

// Only create CosmosClient if we have valid configuration
let cosmosClient: CosmosClient | null = null;

if (cosmosConfig.endpoint && cosmosConfig.key) {
  cosmosClient = new CosmosClient({
    endpoint: cosmosConfig.endpoint,
    key: cosmosConfig.key,
    consistencyLevel: "Session"
  });
} else {
  logger.warn('Cosmos DB configuration is incomplete. Some features may not work.');
}

export { cosmosClient };

export async function initializeCosmosDB() {
  if (!cosmosClient) {
    logger.warn('Cosmos DB client not initialized. Skipping database initialization.');
    return;
  }

  try {
    // Initialize database
    const { database } = await cosmosClient.databases.createIfNotExists({
      id: cosmosConfig.databaseId
    });

    // Initialize containers
    const containersToCreate = [
      { id: cosmosConfig.containers.properties, partitionKey: "/id" },
      { id: cosmosConfig.containers.agents, partitionKey: "/id" },
      { id: cosmosConfig.containers.viewings, partitionKey: "/propertyId" },
      { id: cosmosConfig.containers.users, partitionKey: "/id" },
      { id: cosmosConfig.containers.references, partitionKey: "/id" },
      { id: cosmosConfig.containers.contracts, partitionKey: "/id" },
      { id: cosmosConfig.containers.dashboard, partitionKey: "/userId" }
    ];

    // Create containers if they don't exist
    for (const { id, partitionKey } of containersToCreate) {
      await database.containers.createIfNotExists({
        id,
        partitionKey
      });
      logger.log(`Container ${id} initialized`);
    }

    logger.log('Cosmos DB initialization completed successfully');
  } catch (error) {
    logger.error('Failed to initialize Cosmos DB:', error);
    throw error;
  }
} 