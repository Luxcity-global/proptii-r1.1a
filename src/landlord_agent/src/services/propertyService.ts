import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
  DocumentData
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Property, PropertyPhoto, PropertyDocument } from '../App';

class PropertyService {
  private propertiesCollection = collection(db, 'properties');

  /**
   * Create a new property scoped to the current user
   */
  async createProperty(
    propertyData: Omit<Property, 'id' | 'createdAt' | 'tenant'>,
    ownerUserId: string,
    ownerEmail?: string
  ): Promise<string> {
    try {
      console.log('Creating property with photos:', propertyData.photos?.length || 0, 'photos');
      // Ensure we never persist a client-side placeholder id/createdAt fields
      const { id: _ignoredId, createdAt: _ignoredCreatedAt, ...clean } = (propertyData as any) || {};

      // Clean photos array - remove undefined values (Firestore doesn't accept undefined)
      const cleanedPhotos = (propertyData.photos || []).map(photo => {
        const cleanPhoto: any = {
          id: photo.id,
          url: photo.url,
          filename: photo.filename,
          isCover: photo.isCover
        };
        // Only include room if it's defined
        if (photo.room) {
          cleanPhoto.room = photo.room;
        }
        return cleanPhoto;
      });

      const propertyDoc: any = {
        ...clean,
        userId: ownerUserId,
        photos: cleanedPhotos,
        documents: propertyData.documents || [], // Include documents if provided
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      // Ensure status is always set (default to 'vacant' if missing)
      if (!propertyDoc.status) {
        propertyDoc.status = 'vacant';
        console.log('✅ PropertyService: Setting default status to "vacant"');
      }
      
      // Store owner email if provided (for Proptii search to find agent/landlord email)
      if (ownerEmail) {
        propertyDoc.ownerEmail = ownerEmail.toLowerCase().trim();
        console.log('✅ PropertyService: Storing ownerEmail in property:', ownerEmail);
      }
      
      console.log('✅ PropertyService: Property status:', propertyDoc.status);

      console.log('✅ PropertyService: Creating property with userId:', ownerUserId);
      console.log('Property document to save:', {
        address: propertyDoc.address,
        userId: propertyDoc.userId,
        photosCount: propertyDoc.photos?.length || 0,
        photos: propertyDoc.photos
      });

      const docRef = await addDoc(this.propertiesCollection, propertyDoc);
      console.log('Property created successfully with ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating property:', error);
      console.error('Error details:', {
        message: (error as any)?.message,
        code: (error as any)?.code,
        stack: (error as any)?.stack
      });
      throw error;
    }
  }

  /**
   * Get all properties with optional filters
   */
  async getProperties(
    filters?: {
      status?: Property['status'];
      type?: string;
      userId?: string;
    }
  ): Promise<Property[]> {
    try {
      const constraints: QueryConstraint[] = [];

      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters?.type) {
        constraints.push(where('type', '==', filters.type));
      }
      if (filters?.userId) {
        constraints.push(where('userId', '==', filters.userId));
      }

      // Try to query with orderBy, fallback to in-memory sorting if index missing
      if (constraints.length > 0) {
        try {
          constraints.push(orderBy('createdAt', 'desc'));
          const q = query(this.propertiesCollection, ...constraints);
          const querySnapshot = await getDocs(q);
          const properties = this.mapPropertyDocs(querySnapshot.docs);
          return properties;
        } catch (indexError: any) {
          if (indexError.code === 'failed-precondition' && indexError.message?.includes('index')) {
            console.log('ℹ️ Firestore index not configured, using in-memory sort');
            const q = query(this.propertiesCollection, ...constraints.slice(0, -1)); // Remove orderBy
            const querySnapshot = await getDocs(q);
            const properties = this.mapPropertyDocs(querySnapshot.docs);
            return properties.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          }
          throw indexError;
        }
      } else {
        // No filters, fetch all and sort in memory
        const querySnapshot = await getDocs(this.propertiesCollection);
        const properties = this.mapPropertyDocs(querySnapshot.docs);
        return properties.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
    } catch (error) {
      console.error('Error getting properties:', error);
      throw error;
    }
  }

  /**
   * Get a single property by ID
   */
  async getProperty(propertyId: string): Promise<Property | null> {
    try {
      const docRef = doc(this.propertiesCollection, propertyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return this.mapPropertyDoc(docSnap);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting property:', error);
      throw error;
    }
  }

  /**
   * Update an existing property
   */
  async updateProperty(
    propertyId: string,
    updates: Partial<Omit<Property, 'id' | 'createdAt' | 'tenant'>>
  ): Promise<void> {
    try {
      const docRef = doc(this.propertiesCollection, propertyId);
      // Also remove any legacy 'id' field if present on the document
      const { deleteField } = await import('firebase/firestore');
      await updateDoc(docRef, {
        id: (deleteField as any)(),
        ...updates,
        updatedAt: Timestamp.now(),
      } as any);
      console.log('Property updated successfully:', propertyId);
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
    }
  }

  /**
   * Add a document to an existing property
   */
  async addDocumentToProperty(
    propertyId: string,
    document: Omit<PropertyDocument, 'id'>
  ): Promise<void> {
    try {
      console.log('Adding document to property:', propertyId, document);
      const property = await this.getProperty(propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      const newDocument: any = {
        id: `doc-${Date.now()}`,
        name: document.name,
        type: document.type,
        url: document.url,
        issueDate: Timestamp.fromDate(document.issueDate),
        status: document.status
      };

      if (document.expiryDate) {
        newDocument.expiryDate = Timestamp.fromDate(document.expiryDate);
      }

      // Filter out documents with blob URLs (they can't be saved to Firestore)
      const validExistingDocs = (property.documents || []).filter((doc) => {
        const hasValidUrl = doc.url && !doc.url.startsWith('blob:');
        if (!hasValidUrl) {
          console.log(`Filtering out document with invalid URL: ${doc.name}`, doc.url);
        }
        return hasValidUrl;
      });
      
      // Clean remaining documents to remove any undefined fields
      const cleanExistingDocs = validExistingDocs.map((doc, index) => {
        console.log(`Cleaning existing doc ${index}:`, doc);
        const cleanDoc: any = {
          id: doc.id,
          name: doc.name,
          type: doc.type,
          url: doc.url,
          issueDate: Timestamp.fromDate(doc.issueDate),
          status: doc.status
        };
        if (doc.expiryDate) {
          cleanDoc.expiryDate = Timestamp.fromDate(doc.expiryDate);
        }
        console.log(`Cleaned doc ${index}:`, cleanDoc);
        return cleanDoc;
      });
      
      const updatedDocuments = [...cleanExistingDocs, newDocument];
      console.log(`Filtered out ${(property.documents || []).length - validExistingDocs.length} invalid documents`);
      
      // Estimate size of documents array
      const jsonSize = JSON.stringify(updatedDocuments).length;
      console.log(`Estimated size of documents array: ${(jsonSize / 1024).toFixed(2)} KB`);
      
      if (jsonSize > 500 * 1024) { // 500KB warning
        console.warn('Documents array is large and may exceed Firestore limits when combined with photos');
      }
      
      const docRef = doc(this.propertiesCollection, propertyId);
      
      // Try to validate each document before updating
      for (let i = 0; i < updatedDocuments.length; i++) {
        const docToValidate = updatedDocuments[i];
        console.log(`Validating doc ${i}:`, {
          id: docToValidate.id,
          name: docToValidate.name,
          type: docToValidate.type,
          url: docToValidate.url?.substring(0, 50),
          hasIssueDate: !!docToValidate.issueDate,
          hasExpiryDate: !!docToValidate.expiryDate,
          status: docToValidate.status
        });
        
        // Check for undefined or invalid values
        const keys = Object.keys(docToValidate);
        for (const key of keys) {
          if (docToValidate[key] === undefined) {
            console.error(`Doc ${i} has undefined field:`, key);
          }
        }
      }
      
      await updateDoc(docRef, {
        documents: updatedDocuments,
        updatedAt: Timestamp.now()
      });
      
      console.log('Document added to property successfully:', propertyId);
    } catch (error: any) {
      console.error('Error adding document to property:', error.message, error);
      throw error;
    }
  }

  /**
   * Delete a property
   */
  async deleteProperty(propertyId: string): Promise<void> {
    try {
      const docRef = doc(this.propertiesCollection, propertyId);
      await deleteDoc(docRef);
      console.log('Property deleted successfully:', propertyId);
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  }

  /**
   * Map Firestore document to Property object
   */
  private mapPropertyDoc(doc: any): Property {
    const data = doc.data();
    console.log('📋 Mapping property document:', doc.id);
    console.log('   - Address:', data.address);
    console.log('   - userId in document:', data.userId || '❌ MISSING');
    console.log('   - Photos count:', data.photos?.length || 0);
    const mappedProperty: any = {
      id: doc.id,
      address: data.address || '',
      type: data.type || '',
      bedrooms: data.bedrooms || 1,
      bathrooms: data.bathrooms,
      squareFootage: data.squareFootage,
      rent: data.rent || 0,
      status: data.status || 'vacant',
      amenities: data.amenities || [],
      notes: data.notes || '',
      photos: this.mapPhotos(data.photos || []),
      documents: this.mapDocuments(data.documents || []),
      createdAt: data.createdAt?.toDate() || new Date(),
      tenantId: data.tenantId,
      userId: data.userId, // Preserve userId for verification
    };
    console.log('Mapped property photos:', mappedProperty.photos.length);
    return mappedProperty;
  }

  /**
   * Map multiple Firestore documents to Property array
   */
  private mapPropertyDocs(docs: any[]): Property[] {
    return docs.map(doc => this.mapPropertyDoc(doc));
  }

  /**
   * Map photos array from Firestore
   */
  private mapPhotos(photos: any[]): PropertyPhoto[] {
    if (!photos || !Array.isArray(photos)) {
      console.warn('mapPhotos: photos is not an array:', photos);
      return [];
    }
    console.log('Mapping photos from Firestore:', photos.length, 'photos');
    const mapped = photos.map((photo, index) => {
      const mappedPhoto = {
        id: photo.id || `photo-${index}`,
        url: photo.url || '',
        filename: photo.filename || `property-photo-${index + 1}.jpg`,
        room: photo.room,
        isCover: photo.isCover || false,
      };
      console.log(`Photo ${index}:`, mappedPhoto);
      return mappedPhoto;
    });
    return mapped;
  }

  /**
   * Map documents array from Firestore
   */
  private mapDocuments(documents: any[]): PropertyDocument[] {
    return documents.map(doc => ({
      id: doc.id || '',
      name: doc.name || '',
      type: doc.type || 'other',
      url: doc.url || '',
      issueDate: doc.issueDate?.toDate() || new Date(),
      expiryDate: doc.expiryDate?.toDate(),
      status: doc.status || 'valid',
    }));
  }
}

export const propertyService = new PropertyService();

