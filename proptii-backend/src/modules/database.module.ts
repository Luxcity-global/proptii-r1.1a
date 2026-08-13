import { Module, Global, Logger } from '@nestjs/common';
import { initializeFirestore } from '../config/firestore.config';
import { createCosmosClientFromEnv, resolveCosmosConnection } from '../config/cosmos.config';

@Global()
@Module({
  providers: [
    {
      provide: 'COSMOS_CLIENT',
      useFactory: () => {
        const logger = new Logger('DatabaseModule');
        const creds = resolveCosmosConnection();
        if (!creds) {
          logger.warn('Cosmos DB not configured. Some features will be limited.');
          return null;
        }
        try {
          return createCosmosClientFromEnv();
        } catch (error) {
          logger.error('Failed to create CosmosClient:', error);
          return null;
        }
      },
    },
    {
      provide: 'FIRESTORE',
      useFactory: async () => {
        return await initializeFirestore();
      },
    },
  ],
  exports: ['COSMOS_CLIENT', 'FIRESTORE'],
})
export class DatabaseModule {} 