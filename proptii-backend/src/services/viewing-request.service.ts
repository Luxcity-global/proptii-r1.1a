import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CosmosClient, Container } from '@azure/cosmos';
import { CreateViewingRequestDto, UpdateViewingRequestDto } from '../dtos/viewing-request.dto';

@Injectable()
export class ViewingRequestService {
  private container: Container;

  constructor(
    @Inject('COSMOS_CLIENT') private readonly cosmosClient: CosmosClient
  ) {
    const database = this.cosmosClient.database(process.env.COSMOS_DB_DATABASE_NAME);
    this.container = database.container('Viewings');
  }

  async create(createViewingRequestDto: CreateViewingRequestDto): Promise<any> {
    try {
      // Check for conflicting viewings
      const { resources: conflictingViewings } = await this.container.items
        .query({
          query: 'SELECT * FROM c WHERE c.viewing_date = @date AND c.viewing_time = @time AND c.property.postcode = @postcode',
          parameters: [
            { name: '@date', value: createViewingRequestDto.viewing_date },
            { name: '@time', value: createViewingRequestDto.viewing_time },
            { name: '@postcode', value: createViewingRequestDto.property.postcode }
          ]
        })
        .fetchAll();

      if (conflictingViewings.length > 0) {
        throw new BadRequestException('This viewing slot is already booked');
      }

      // Create the viewing request
      const { resource: createdViewing } = await this.container.items.create({
        ...createViewingRequestDto,
        type: 'viewing-request',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return createdViewing;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error('Failed to create viewing request: ' + error.message);
    }
  }

  async findAll(): Promise<any[]> {
    const { resources } = await this.container.items
      .query({
        query: 'SELECT * FROM c WHERE c.type = "viewing-request"'
      })
      .fetchAll();
    return resources;
  }

  async findOne(id: string): Promise<any> {
    try {
      const { resource } = await this.container.item(id).read();
      if (!resource) {
        throw new NotFoundException(`Viewing request with ID ${id} not found`);
      }
      return resource;
    } catch (error) {
      throw new NotFoundException(`Viewing request with ID ${id} not found`);
    }
  }

  async findByProperty(propertyId: string): Promise<any[]> {
    const { resources } = await this.container.items
      .query({
        query: 'SELECT * FROM c WHERE c.type = "viewing-request" AND c.property.id = @propertyId',
        parameters: [{ name: '@propertyId', value: propertyId }]
      })
      .fetchAll();
    return resources;
  }

  async findByAgent(agentId: string): Promise<any[]> {
    const { resources } = await this.container.items
      .query({
        query: 'SELECT * FROM c WHERE c.type = "viewing-request" AND c.agent.id = @agentId',
        parameters: [{ name: '@agentId', value: agentId }]
      })
      .fetchAll();
    return resources;
  }

  async update(id: string, updateViewingRequestDto: UpdateViewingRequestDto): Promise<any> {
    try {
      const { resource: existingViewing } = await this.container.item(id).read();
      if (!existingViewing) {
        throw new NotFoundException(`Viewing request with ID ${id} not found`);
      }

      const updatedViewing = {
        ...existingViewing,
        ...updateViewingRequestDto,
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.item(id).replace(updatedViewing);
      return resource;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Failed to update viewing request: ' + error.message);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.container.item(id).delete();
    } catch (error) {
      throw new NotFoundException(`Viewing request with ID ${id} not found`);
    }
  }
} 