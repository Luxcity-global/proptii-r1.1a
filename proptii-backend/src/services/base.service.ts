import { CosmosClient, Container, Database } from '@azure/cosmos';
import { cosmosClient, cosmosConfig } from '../config/cosmos.config';

export abstract class BaseService {
  protected database: Database;
  protected container: Container;

  constructor(containerName: string) {
    this.database = cosmosClient.database(cosmosConfig.databaseId);
    this.container = this.database.container(containerName);
  }

  protected async create<T>(item: T): Promise<T> {
    const { resource } = await this.container.items.create(item);
    return resource as T;
  }

  protected async findById<T>(id: string): Promise<T | null> {
    try {
      const { resource } = await this.container.item(id).read();
      return resource as T;
    } catch (error) {
      if (error.code === 404) {
        return null;
      }
      throw error;
    }
  }

  protected async findAll<T>(query: string = 'SELECT * FROM c'): Promise<T[]> {
    const { resources } = await this.container.items.query(query).fetchAll();
    return resources as T[];
  }

  protected async update<T>(id: string, item: Partial<T>): Promise<T> {
    const { resource } = await this.container.item(id).replace(item);
    return resource as T;
  }

  protected async delete(id: string): Promise<void> {
    await this.container.item(id).delete();
  }

  protected async query<T>(query: string, parameters: any[] = []): Promise<T[]> {
    const { resources } = await this.container.items.query({
      query,
      parameters
    }).fetchAll();
    return resources as T[];
  }
} 