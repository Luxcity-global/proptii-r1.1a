import { CosmosClient, Container, Database } from '@azure/cosmos';

export interface CosmosConfig {
  endpoint: string;
  key: string;
  databaseId: string;
  containers: {
    users: string;
    references: string;
    viewings: string;
    contracts: string;
    dashboard: string;
  };
}

export class CosmosDBService {
  private client: CosmosClient;
  private database: Database;
  private containers: {
    users: Container;
    references: Container;
    viewings: Container;
    contracts: Container;
    dashboard: Container;
  };

  constructor(private config: CosmosConfig) {
    this.client = new CosmosClient({
      endpoint: config.endpoint,
      key: config.key,
      consistencyLevel: "Session"
    });
  }

  async initialize() {
    try {
      // Initialize database
      const { database } = await this.client.databases.createIfNotExists({
        id: this.config.databaseId
      });
      this.database = database;

      // Initialize containers
      const containersToCreate = [
        { id: this.config.containers.users, partitionKey: "/id" },
        { id: this.config.containers.references, partitionKey: "/id" },
        { id: this.config.containers.viewings, partitionKey: "/propertyId" },
        { id: this.config.containers.contracts, partitionKey: "/id" },
        { id: this.config.containers.dashboard, partitionKey: "/userId" }
      ];

      // Initialize all containers
      const containerPromises = containersToCreate.map(async ({ id, partitionKey }) => {
        const { container } = await this.database.containers.createIfNotExists({
          id,
          partitionKeyPath: partitionKey
        });
        return { id, container };
      });

      const initializedContainers = await Promise.all(containerPromises);

      // Assign containers to their respective properties
      this.containers = initializedContainers.reduce((acc, { id, container }) => {
        const key = Object.entries(this.config.containers)
          .find(([_, value]) => value === id)?.[0] as keyof typeof this.containers;
        
        if (key) {
          acc[key] = container;
        }
        return acc;
      }, {} as typeof this.containers);

    } catch (error) {
      console.error('Failed to initialize Cosmos DB:', error);
      throw error;
    }
  }

  // Base CRUD operations
  protected async create<T extends { id: string }>(
    container: Container,
    item: T
  ): Promise<T> {
    const { resource } = await container.items.create(item);
    return resource as T;
  }

  protected async read<T>(
    container: Container,
    id: string,
    partitionKey: string
  ): Promise<T | undefined> {
    try {
      const { resource } = await container.item(id, partitionKey).read();
      return resource as T;
    } catch (error: any) {
      if (error.code === 404) {
        return undefined;
      }
      throw error;
    }
  }

  protected async update<T extends { id: string }>(
    container: Container,
    id: string,
    partitionKey: string,
    updates: Partial<T>
  ): Promise<T> {
    const { resource } = await container.item(id, partitionKey).replace(updates);
    return resource as T;
  }

  protected async delete(
    container: Container,
    id: string,
    partitionKey: string
  ): Promise<void> {
    await container.item(id, partitionKey).delete();
  }

  protected async query<T>(
    container: Container,
    query: string,
    parameters: { [key: string]: any } = {}
  ): Promise<T[]> {
    const { resources } = await container.items
      .query({ query, parameters })
      .fetchAll();
    return resources as T[];
  }

  // Helper methods to access containers
  protected getUsersContainer(): Container {
    return this.containers.users;
  }

  protected getReferencesContainer(): Container {
    return this.containers.references;
  }

  protected getViewingsContainer(): Container {
    return this.containers.viewings;
  }

  protected getContractsContainer(): Container {
    return this.containers.contracts;
  }

  protected getDashboardContainer(): Container {
    return this.containers.dashboard;
  }
} 