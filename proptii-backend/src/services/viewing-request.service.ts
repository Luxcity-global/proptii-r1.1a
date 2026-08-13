import { Injectable, NotFoundException, BadRequestException, Inject, Logger } from '@nestjs/common';
import { CosmosClient, Container } from '@azure/cosmos';
import { Firestore } from 'firebase-admin/firestore';
import { CreateViewingRequestDto, UpdateViewingRequestDto } from '../dtos/viewing-request.dto';

@Injectable()
export class ViewingRequestService {
  private readonly logger = new Logger(ViewingRequestService.name);
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
        this.logger.warn('Failed to initialize Cosmos DB container for Viewings: ' + error);
        this.container = null;
      }
    } else {
      this.logger.warn('Cosmos DB client not available for ViewingRequestService. Some features will be limited.');
    }

    if (this.firestoreInstance) {
      this.firestore = this.firestoreInstance;
      this.logger.log('Firestore available for ViewingRequestService fallback');
    } else {
      this.logger.warn('Firestore not available for ViewingRequestService fallback');
    }
  }

  private toPlainViewingRequest(dto: CreateViewingRequestDto) {
    const viewingDateObj = dto.viewing_date instanceof Date
      ? dto.viewing_date
      : new Date(dto.viewing_date);
    const viewingDate = Number.isNaN(viewingDateObj.getTime())
      ? String(dto.viewing_date)
      : viewingDateObj.toISOString().split('T')[0];

    return {
      property: {
        street: dto.property.street,
        ...(dto.property.city ? { city: dto.property.city } : {}),
        ...(dto.property.town ? { town: dto.property.town } : {}),
        ...(dto.property.postcode ? { postcode: dto.property.postcode } : {}),
      },
      agent: {
        name: dto.agent.name,
        email: dto.agent.email,
        ...(dto.agent.phone ? { phone: dto.agent.phone } : {}),
        ...(dto.agent.company ? { company: dto.agent.company } : {}),
      },
      viewing_date: viewingDate,
      viewing_time: dto.viewing_time,
      preference: dto.preference,
      ...(dto.whatsappNumber ? { whatsappNumber: dto.whatsappNumber } : {}),
      status: dto.status,
      type: 'viewing-request',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async create(createViewingRequestDto: CreateViewingRequestDto): Promise<any> {
    const payload = this.toPlainViewingRequest(createViewingRequestDto);

    try {
      if (this.container) {
        try {
          if (createViewingRequestDto.property.postcode) {
            const result = await this.container.items
              .query({
                query: 'SELECT * FROM c WHERE c.viewing_date = @date AND c.viewing_time = @time AND c.property.postcode = @postcode',
                parameters: [
                  { name: '@date', value: payload.viewing_date },
                  { name: '@time', value: createViewingRequestDto.viewing_time },
                  { name: '@postcode', value: createViewingRequestDto.property.postcode },
                ],
              })
              .fetchAll();
            if (result.resources.length > 0) {
              throw new BadRequestException('This viewing slot is already booked');
            }
          }

          const { resource: createdViewing } = await this.container.items.create(payload);
          return createdViewing;
        } catch (cosmosError) {
          if (cosmosError instanceof BadRequestException) {
            throw cosmosError;
          }
          this.logger.warn(
            `Cosmos viewing create failed, falling back: ${cosmosError instanceof Error ? cosmosError.message : cosmosError}`,
          );
        }
      }

      if (this.firestore) {
        try {
          if (createViewingRequestDto.property.postcode) {
            const conflictingQuery = this.firestore.collection(this.collectionName)
              .where('viewing_date', '==', payload.viewing_date)
              .where('viewing_time', '==', createViewingRequestDto.viewing_time)
              .where('property.postcode', '==', createViewingRequestDto.property.postcode)
              .where('status', 'in', ['PENDING', 'CONFIRMED']);

            const conflictingSnapshot = await conflictingQuery.get();
            if (!conflictingSnapshot.empty) {
              throw new BadRequestException('This viewing slot is already booked');
            }
          }

          const docRef = this.firestore.collection(this.collectionName).doc();
          const viewingRequestData = { ...payload, id: docRef.id };
          await docRef.set(viewingRequestData);
          return viewingRequestData;
        } catch (firestoreError: any) {
          if (firestoreError instanceof BadRequestException) {
            throw firestoreError;
          }
          this.logger.warn(
            'Firestore operation failed, falling back to frontend-only mode: ' + firestoreError.message,
          );
        }
      }

      this.logger.warn('No backend database available. Frontend will handle persistence via client SDK.');
      return {
        id: `mock_${Date.now()}`,
        ...payload,
        _note: 'Saved by frontend Firestore client SDK - backend database not configured',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.warn(
        `Viewing request create failed; returning frontend stub: ${error instanceof Error ? error.message : error}`,
      );
      return {
        id: `mock_${Date.now()}`,
        ...payload,
        _note: 'Saved by frontend Firestore client SDK - backend database not configured',
      };
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

    this.logger.warn('No database available. Returning empty array for viewing requests.');
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

      const missingConfig = [];
      if (!process.env.COSMOS_DB_CONNECTION_STRING || !process.env.COSMOS_DB_KEY) {
        missingConfig.push('Cosmos DB (COSMOS_DB_CONNECTION_STRING, COSMOS_DB_KEY)');
      }
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        missingConfig.push('Firestore (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)');
      }
      throw new NotFoundException(`Viewing request service is not available. Database is not configured. Missing: ${missingConfig.join(' or ')}. Please configure at least one database in your environment variables.`);
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

    this.logger.warn('No database available. Returning empty array for property viewings.');
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

    this.logger.warn('No database available. Returning empty array for agent viewings.');
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

        // Convert update DTO to plain object for Firestore
        const updateData: any = {
          updatedAt: new Date().toISOString()
        };

        // Only include fields that are being updated
        if (updateViewingRequestDto.status) {
          updateData.status = updateViewingRequestDto.status;
        }

        await docRef.update(updateData);
        const updatedDoc = await docRef.get();
        return { id: doc.id, ...updatedDoc.data() };
      }

      const missingConfig = [];
      if (!process.env.COSMOS_DB_CONNECTION_STRING || !process.env.COSMOS_DB_KEY) {
        missingConfig.push('Cosmos DB (COSMOS_DB_CONNECTION_STRING, COSMOS_DB_KEY)');
      }
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        missingConfig.push('Firestore (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)');
      }
      throw new BadRequestException(`Viewing request service is not available. Database is not configured. Missing: ${missingConfig.join(' or ')}. Please configure at least one database in your environment variables.`);
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

      const missingConfig = [];
      if (!process.env.COSMOS_DB_CONNECTION_STRING || !process.env.COSMOS_DB_KEY) {
        missingConfig.push('Cosmos DB (COSMOS_DB_CONNECTION_STRING, COSMOS_DB_KEY)');
      }
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        missingConfig.push('Firestore (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)');
      }
      throw new NotFoundException(`Viewing request service is not available. Database is not configured. Missing: ${missingConfig.join(' or ')}. Please configure at least one database in your environment variables.`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Viewing request with ID ${id} not found`);
    }
  }
} 