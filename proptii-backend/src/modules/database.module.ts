import { Module, Global } from '@nestjs/common';
import { CosmosClient } from '@azure/cosmos';

@Global()
@Module({
  providers: [
    {
      provide: 'COSMOS_CLIENT',
      useFactory: () => {
        const endpoint = process.env.COSMOS_DB_CONNECTION_STRING || 'https://your-cosmos-account.documents.azure.com:443/';
        const key = process.env.COSMOS_DB_KEY;
        return new CosmosClient({ endpoint, key });
      },
    },
  ],
  exports: ['COSMOS_CLIENT'],
})
export class DatabaseModule {} 