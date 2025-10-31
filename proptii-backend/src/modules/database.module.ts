import { Module, Global } from '@nestjs/common';
import { CosmosClient } from '@azure/cosmos';

@Global()
@Module({
  providers: [
    {
      provide: 'COSMOS_CLIENT',
      useFactory: () => {
        const endpoint = process.env.COSMOS_DB_CONNECTION_STRING;
        const key = process.env.COSMOS_DB_KEY;
        
        // Return null if Cosmos DB is not configured
        if (!endpoint || !key || endpoint === 'https://your-cosmos-account.documents.azure.com:443/') {
          console.warn('Cosmos DB not configured. Some features will be limited.');
          return null;
        }
        
        try {
          return new CosmosClient({ endpoint, key });
        } catch (error) {
          console.error('Failed to create CosmosClient:', error);
          return null;
        }
      },
    },
  ],
  exports: ['COSMOS_CLIENT'],
})
export class DatabaseModule {} 