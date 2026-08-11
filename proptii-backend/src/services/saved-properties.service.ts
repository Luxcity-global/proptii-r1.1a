import { Injectable, NotFoundException, BadRequestException, Inject, Logger } from '@nestjs/common';
import { CosmosClient, Container } from '@azure/cosmos';
import { Firestore } from 'firebase-admin/firestore';

@Injectable()
export class SavedPropertiesService {
  private readonly logger = new Logger(SavedPropertiesService.name);
  private container: Container | null = null;
  private firestore: Firestore | null = null;
  private readonly collectionName = 'savedProperties';

  constructor(
    @Inject('COSMOS_CLIENT') private readonly cosmosClient: CosmosClient | null,
    @Inject('FIRESTORE') private readonly firestoreInstance: Firestore | null
  ) {
    if (this.cosmosClient) {
      try {
        const database = this.cosmosClient.database(process.env.COSMOS_DB_DATABASE_NAME || 'proptii-db');
        this.container = database.container('Users'); // We could store it in Users container or create a new one. Let's use 'SavedProperties'
      } catch (error) {
        this.logger.warn('Failed to initialize Cosmos DB container for SavedProperties: ' + error);
      }
    }
    
    if (this.firestoreInstance) {
      this.firestore = this.firestoreInstance;
    }
  }

  async saveProperty(userId: string, propertyData: any): Promise<any> {
    const dataToSave = {
      ...propertyData,
      savedAt: new Date().toISOString(),
    };

    if (this.firestore) {
      const propertyId = propertyData.id || `prop_${Date.now()}`;
      await this.firestore
        .collection('savedProperties')
        .doc(userId)
        .collection('items')
        .doc(propertyId)
        .set(dataToSave);
      return { id: propertyId, ...dataToSave };
    }

    // Fallback stub if DB is missing
    dataToSave.id = `mock_${Date.now()}`;
    return dataToSave;
  }

  async getSavedProperties(userId: string): Promise<any[]> {
    if (this.firestore) {
      const snapshot = await this.firestore
        .collection('savedProperties')
        .doc(userId)
        .collection('items')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    return [];
  }

  async removeSavedProperty(userId: string, propertyId: string): Promise<void> {
    if (this.firestore) {
      const docRef = this.firestore
        .collection('savedProperties')
        .doc(userId)
        .collection('items')
        .doc(propertyId);
      
      const doc = await docRef.get();
      if (!doc.exists) {
        throw new NotFoundException('Saved property not found');
      }
      
      await docRef.delete();
    }
  }
}
