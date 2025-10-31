import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface PropertySelection {
  id: string;
  userId: string;
  propertyId: string;
  property: {
    title: string;
    address: string;
    price: string;
    bedrooms: number;
    bathrooms: number;
    propertyType: string;
    description: string;
    images: string[];
    agent: {
      id: string;
      name: string;
      email: string;
      phone: string;
      company: string;
    };
    location: {
      street: string;
      town: string;
      city: string;
      postcode: string;
    };
  };
  status: 'interested' | 'viewing_requested' | 'viewing_scheduled' | 'viewing_completed' | 'rejected';
  source: 'search_results' | 'direct_booking' | 'agent_recommendation';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notes?: string;
  viewingRequestedAt?: Timestamp;
  viewingScheduledAt?: Timestamp;
  viewingCompletedAt?: Timestamp;
}

export interface PropertySelectionStats {
  total: number;
  interested: number;
  viewingRequested: number;
  viewingScheduled: number;
  viewingCompleted: number;
  rejected: number;
}

class PropertySelectionService {
  private readonly collectionName = 'propertySelections';

  /**
   * Save a property selection (when user clicks on a listing)
   */
  async savePropertySelection(
    userId: string,
    propertyData: PropertySelection['property'],
    propertyId: string,
    source: PropertySelection['source'] = 'search_results'
  ): Promise<{ success: boolean; selectionId?: string; error?: string }> {
    try {
      // Check if we're online
      if (!navigator.onLine) {
        console.warn('⚠️ Device is offline, property selection will be saved when connection is restored');
        return { 
          success: false, 
          error: 'Device is offline. Property selection will be saved when connection is restored.' 
        };
      }

      const selectionId = `${userId}_${propertyId}_${Date.now()}`;
      const docRef = doc(db, this.collectionName, selectionId);
      
      const selectionData: PropertySelection = {
        id: selectionId,
        userId,
        propertyId,
        property: propertyData,
        status: 'interested',
        source,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      await setDoc(docRef, selectionData);
      
      console.log('✅ Property selection saved to Firestore successfully');
      return { success: true, selectionId };
    } catch (error: any) {
      console.error('❌ Error saving property selection to Firestore:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'unavailable') {
        return { 
          success: false, 
          error: 'Firestore is currently unavailable. Please check your internet connection and try again.' 
        };
      }
      
      if (error.code === 'permission-denied') {
        console.warn('⚠️ Firestore permission denied - this is expected if Firestore security rules are not configured yet');
        return { 
          success: false, 
          error: 'Firestore access denied. Please configure Firestore security rules or check your Firebase setup.' 
        };
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get all property selections for a user
   */
  async getUserPropertySelections(userId: string): Promise<{ success: boolean; selections?: PropertySelection[]; error?: string }> {
    try {
      console.log('Getting user property selections for userId:', userId);
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const selections: PropertySelection[] = [];
      
      console.log('Property selections query snapshot size:', querySnapshot.size);
      querySnapshot.forEach((doc) => {
        console.log('Found property selection document:', doc.id, doc.data());
        selections.push(doc.data() as PropertySelection);
      });
      
      console.log('Retrieved property selections:', selections);
      return { success: true, selections };
    } catch (error) {
      console.error('❌ Error getting user property selections:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get property selections by status
   */
  async getPropertySelectionsByStatus(
    userId: string, 
    status: PropertySelection['status']
  ): Promise<{ success: boolean; selections?: PropertySelection[]; error?: string }> {
    try {
      console.log(`Getting property selections for userId: ${userId}, status: ${status}`);
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const selections: PropertySelection[] = [];
      
      console.log(`Property selections query snapshot size for status ${status}:`, querySnapshot.size);
      querySnapshot.forEach((doc) => {
        console.log(`Found property selection document for status ${status}:`, doc.id, doc.data());
        selections.push(doc.data() as PropertySelection);
      });
      
      console.log(`Retrieved property selections for status ${status}:`, selections);
      return { success: true, selections };
    } catch (error) {
      console.error('❌ Error getting property selections by status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Update property selection status
   */
  async updatePropertySelectionStatus(
    selectionId: string,
    status: PropertySelection['status'],
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, this.collectionName, selectionId);
      const updateData: any = {
        status,
        updatedAt: serverTimestamp()
      };

      // Add timestamp based on status
      switch (status) {
        case 'viewing_requested':
          updateData.viewingRequestedAt = serverTimestamp();
          break;
        case 'viewing_scheduled':
          updateData.viewingScheduledAt = serverTimestamp();
          break;
        case 'viewing_completed':
          updateData.viewingCompletedAt = serverTimestamp();
          break;
      }

      if (notes) updateData.notes = notes;

      await updateDoc(docRef, updateData);
      
      console.log(`✅ Property selection status updated to ${status}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating property selection status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get property selection statistics for a user
   */
  async getPropertySelectionStats(userId: string): Promise<{ success: boolean; stats?: PropertySelectionStats; error?: string }> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const stats: PropertySelectionStats = {
        total: 0,
        interested: 0,
        viewingRequested: 0,
        viewingScheduled: 0,
        viewingCompleted: 0,
        rejected: 0
      };
      
      querySnapshot.forEach((doc) => {
        const selection = doc.data() as PropertySelection;
        stats.total++;
        
        switch (selection.status) {
          case 'interested':
            stats.interested++;
            break;
          case 'viewing_requested':
            stats.viewingRequested++;
            break;
          case 'viewing_scheduled':
            stats.viewingScheduled++;
            break;
          case 'viewing_completed':
            stats.viewingCompleted++;
            break;
          case 'rejected':
            stats.rejected++;
            break;
        }
      });
      
      return { success: true, stats };
    } catch (error) {
      console.error('❌ Error getting property selection stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Delete a property selection
   */
  async deletePropertySelection(selectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, this.collectionName, selectionId);
      await deleteDoc(docRef);
      
      console.log('✅ Property selection deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting property selection:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Subscribe to real-time updates for user property selections
   */
  subscribeToUserPropertySelections(
    userId: string,
    callback: (selections: PropertySelection[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const selections: PropertySelection[] = [];
        querySnapshot.forEach((doc) => {
          selections.push(doc.data() as PropertySelection);
        });
        callback(selections);
      },
      (error) => {
        console.error('❌ Error in property selections subscription:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  }

  /**
   * Subscribe to real-time updates for property selection stats
   */
  subscribeToPropertySelectionStats(
    userId: string,
    callback: (stats: PropertySelectionStats) => void,
    onError?: (error: Error) => void
  ): () => void {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId)
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const stats: PropertySelectionStats = {
          total: 0,
          interested: 0,
          viewingRequested: 0,
          viewingScheduled: 0,
          viewingCompleted: 0,
          rejected: 0
        };
        
        querySnapshot.forEach((doc) => {
          const selection = doc.data() as PropertySelection;
          stats.total++;
          
          switch (selection.status) {
            case 'interested':
              stats.interested++;
              break;
            case 'viewing_requested':
              stats.viewingRequested++;
              break;
            case 'viewing_scheduled':
              stats.viewingScheduled++;
              break;
            case 'viewing_completed':
              stats.viewingCompleted++;
              break;
            case 'rejected':
              stats.rejected++;
              break;
          }
        });
        
        callback(stats);
      },
      (error) => {
        console.error('❌ Error in property selection stats subscription:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  }
}

export const propertySelectionService = new PropertySelectionService();
export default propertySelectionService;
