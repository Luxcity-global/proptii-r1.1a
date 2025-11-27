import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { CosmosClient, Container } from '@azure/cosmos';
import { Firestore } from 'firebase-admin/firestore';
import { CreateViewingRequestDto, UpdateViewingRequestDto } from '../dtos/viewing-request.dto';

@Injectable()
export class ViewingRequestService {
  private container: Container | null = null;
  private firestore: Firestore | null = null;
  private readonly collectionName = 'viewingRequests';

  constructor(
    @Inject('COSMOS_CLIENT') private readonly cosmosClient: CosmosClient | null,
    @Inject('FIRESTORE') private readonly firestoreInstance: Firestore | null
  ) {
    if (this.cosmosClient) {
      try {
        const database = this.cosmosClient.database(process.env.COSMOS_DB_DATABASE_NAME || 'proptii-db');
        this.container = database.container('Viewings');
      } catch (error) {
        console.warn('Failed to initialize Cosmos DB container for Viewings:', error);
        this.container = null;
      }
    } else {
      console.warn('Cosmos DB client not available for ViewingRequestService. Some features will be limited.');
    }

    if (this.firestoreInstance) {
      this.firestore = this.firestoreInstance;
      console.log('✅ Firestore available for ViewingRequestService fallback');
    } else {
      console.warn('⚠️ Firestore not available for ViewingRequestService fallback');
    }
  }

  async create(createViewingRequestDto: CreateViewingRequestDto): Promise<any> {
    try {
      // Use Cosmos DB if available
      if (this.container) {
        // Check for conflicting viewings (only if postcode is provided)
        let conflictingViewings: any[] = [];
        if (createViewingRequestDto.property.postcode) {
          const result = await this.container.items
            .query({
              query: 'SELECT * FROM c WHERE c.viewing_date = @date AND c.viewing_time = @time AND c.property.postcode = @postcode',
              parameters: [
                { name: '@date', value: createViewingRequestDto.viewing_date },
                { name: '@time', value: createViewingRequestDto.viewing_time },
                { name: '@postcode', value: createViewingRequestDto.property.postcode }
              ]
            })
            .fetchAll();
          conflictingViewings = result.resources;
        }

        if (conflictingViewings.length > 0) {
          throw new BadRequestException('This viewing slot is already booked');
        }

        // Create the viewing request in Cosmos DB
        const { resource: createdViewing } = await this.container.items.create({
          ...createViewingRequestDto,
          type: 'viewing-request',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        return createdViewing;
      }
      
      // Fallback to Firestore if Cosmos DB is not available
      if (this.firestore) {
        // Check for conflicting viewings in Firestore (only if postcode is provided)
        if (createViewingRequestDto.property.postcode) {
          const viewingDateStr = typeof createViewingRequestDto.viewing_date === 'string' 
            ? createViewingRequestDto.viewing_date 
            : new Date(createViewingRequestDto.viewing_date).toISOString().split('T')[0];
          
          const conflictingQuery = this.firestore.collection(this.collectionName)
            .where('viewing_date', '==', viewingDateStr)
            .where('viewing_time', '==', createViewingRequestDto.viewing_time)
            .where('property.postcode', '==', createViewingRequestDto.property.postcode)
            .where('status', 'in', ['PENDING', 'CONFIRMED']);
          
          const conflictingSnapshot = await conflictingQuery.get();
          
          if (!conflictingSnapshot.empty) {
            throw new BadRequestException('This viewing slot is already booked');
          }
        }

        // Create the viewing request in Firestore
        const docRef = this.firestore.collection(this.collectionName).doc();
        
        // Convert viewing_date to string format for Firestore (YYYY-MM-DD)
        const viewingDateObj = createViewingRequestDto.viewing_date instanceof Date
          ? createViewingRequestDto.viewing_date
          : new Date(createViewingRequestDto.viewing_date);
        const viewingDate = viewingDateObj.toISOString().split('T')[0];
        
        const viewingRequestData = {
          ...createViewingRequestDto,
          viewing_date: viewingDate, // Store as string in YYYY-MM-DD format
          id: docRef.id,
          type: 'viewing-request',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await docRef.set(viewingRequestData);

        return {
          id: docRef.id,
          ...viewingRequestData
        };
      }

      // Neither database is available
      throw new BadRequestException('Viewing request service is not available. Database is not configured.');
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error('Failed to create viewing request: ' + error.message);
    }
  }

  async findAll(): Promise<any[]> {
    if (this.container) {
      const { resources } = await this.container.items
        .query({
          query: 'SELECT * FROM c WHERE c.type = "viewing-request"'
        })
        .fetchAll();
      return resources;
    }
    
    if (this.firestore) {
      const snapshot = await this.firestore.collection(this.collectionName)
        .where('type', '==', 'viewing-request')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    console.warn('No database available. Returning empty array for viewing requests.');
    return [];
  }

  async findOne(id: string): Promise<any> {
    try {
      if (this.container) {
        const { resource } = await this.container.item(id).read();
        if (!resource) {
          throw new NotFoundException(`Viewing request with ID ${id} not found`);
        }
        return resource;
      }
      
      if (this.firestore) {
        const doc = await this.firestore.collection(this.collectionName).doc(id).get();
        if (!doc.exists) {
          throw new NotFoundException(`Viewing request with ID ${id} not found`);
        }
        return { id: doc.id, ...doc.data() };
      }
      
      throw new NotFoundException(`Viewing request service is not available. Database is not configured.`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Viewing request with ID ${id} not found`);
    }
  }

  async findByProperty(propertyId: string): Promise<any[]> {
    if (this.container) {
      const { resources } = await this.container.items
        .query({
          query: 'SELECT * FROM c WHERE c.type = "viewing-request" AND c.property.id = @propertyId',
          parameters: [{ name: '@propertyId', value: propertyId }]
        })
        .fetchAll();
      return resources;
    }
    
    if (this.firestore) {
      const snapshot = await this.firestore.collection(this.collectionName)
        .where('type', '==', 'viewing-request')
        .where('property.id', '==', propertyId)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    console.warn('No database available. Returning empty array for property viewings.');
    return [];
  }

  async findByAgent(agentId: string): Promise<any[]> {
    if (this.container) {
      const { resources } = await this.container.items
        .query({
          query: 'SELECT * FROM c WHERE c.type = "viewing-request" AND c.agent.id = @agentId',
          parameters: [{ name: '@agentId', value: agentId }]
        })
        .fetchAll();
      return resources;
    }
    
    if (this.firestore) {
      const snapshot = await this.firestore.collection(this.collectionName)
        .where('type', '==', 'viewing-request')
        .where('agent.id', '==', agentId)
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    
    console.warn('No database available. Returning empty array for agent viewings.');
    return [];
  }

  async update(id: string, updateViewingRequestDto: UpdateViewingRequestDto): Promise<any> {
    try {
      if (this.container) {
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
      }
      
      if (this.firestore) {
        const docRef = this.firestore.collection(this.collectionName).doc(id);
        const doc = await docRef.get();
        
        if (!doc.exists) {
          throw new NotFoundException(`Viewing request with ID ${id} not found`);
        }

        const updatedViewing = {
          ...doc.data(),
          ...updateViewingRequestDto,
          updatedAt: new Date().toISOString()
        };

        await docRef.update(updatedViewing);
        return { id: doc.id, ...updatedViewing };
      }
      
      throw new BadRequestException('Viewing request service is not available. Database is not configured.');
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new Error('Failed to update viewing request: ' + error.message);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      if (this.container) {
        await this.container.item(id).delete();
        return;
      }
      
      if (this.firestore) {
        const docRef = this.firestore.collection(this.collectionName).doc(id);
        const doc = await docRef.get();
        
        if (!doc.exists) {
          throw new NotFoundException(`Viewing request with ID ${id} not found`);
        }
        
        await docRef.delete();
        return;
      }
      
      throw new NotFoundException(`Viewing request service is not available. Database is not configured.`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Viewing request with ID ${id} not found`);
    }
  }
} 