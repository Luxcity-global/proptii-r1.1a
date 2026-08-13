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
    billingEvents: string;
  };
}

function stripQuotes(value: string): string {
  return value.trim().replace(/^['"]+|['"]+$/g, '');
}

/**
 * COSMOS_DB_CONNECTION_STRING is historically either:
 * - an account endpoint URL: https://….documents.azure.com:443/
 * - a full Azure connection string: AccountEndpoint=…;AccountKey=…;
 *
 * Passing a full connection string as `endpoint` + a separate key causes
 * Cosmos "wrong key / payload not built as per the protocol".
 */
export function resolveCosmosConnection(): { endpoint: string; key: string } | null {
  const raw = stripQuotes(
    process.env.COSMOS_DB_CONNECTION_STRING || process.env.COSMOS_DB_ENDPOINT || '',
  );
  const envKey = stripQuotes(process.env.COSMOS_DB_KEY || '');

  if (!raw) return null;

  if (/AccountEndpoint=/i.test(raw)) {
    const endpoint = stripQuotes(raw.match(/AccountEndpoint=([^;]+)/i)?.[1] || '');
    const keyFromConn = stripQuotes(raw.match(/AccountKey=([^;]+)/i)?.[1] || '');
    const key = keyFromConn || envKey;
    if (!endpoint || !key) return null;
    return { endpoint: endpoint.replace(/\/+$/, ''), key };
  }

  if (!envKey) return null;
  return { endpoint: raw.replace(/\/+$/, ''), key: envKey };
}

export function createCosmosClientFromEnv(): CosmosClient | null {
  const creds = resolveCosmosConnection();
  if (!creds) {
    logger.warn('Cosmos DB configuration is incomplete. Some features may not work.');
    return null;
  }
  if (creds.endpoint === 'https://your-cosmos-account.documents.azure.com:443') {
    logger.warn('Cosmos DB still has placeholder endpoint. Skipping client.');
    return null;
  }
  return new CosmosClient({
    endpoint: creds.endpoint,
    key: creds.key,
    consistencyLevel: 'Session',
  });
}

export const cosmosConfig: CosmosConfig = {
  get endpoint() {
    return resolveCosmosConnection()?.endpoint || '';
  },
  get key() {
    return resolveCosmosConnection()?.key || '';
  },
  get databaseId() {
    return process.env.COSMOS_DB_DATABASE_NAME || 'proptii-db';
  },
  containers: {
    properties: 'Properties',
    agents: 'Agents',
    viewings: 'Viewings',
    users: 'Users',
    references: 'References',
    contracts: 'Contracts',
    dashboard: 'Dashboard',
    billingEvents: 'BillingEvents'
  }
};

let cosmosClient: CosmosClient | null = null;

export function getOrCreateCosmosClient(): CosmosClient | null {
  if (cosmosClient) return cosmosClient;
  cosmosClient = createCosmosClientFromEnv();
  return cosmosClient;
}

export { cosmosClient };

export async function initializeCosmosDB() {
  const client = getOrCreateCosmosClient();
  if (!client) {
    logger.warn('Cosmos DB client not initialized. Skipping database initialization.');
    return;
  }

  try {
    // Initialize database
    const { database } = await client.databases.createIfNotExists({
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
      { id: cosmosConfig.containers.dashboard, partitionKey: "/userId" },
      { id: cosmosConfig.containers.billingEvents, partitionKey: "/id" },
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