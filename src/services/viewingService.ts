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

export interface ViewingBooking {
  id: string;
  userId: string;
  propertyId?: string | null;
  property: {
    street: string;
    town: string;
    city: string;
    postcode: string;
    agent: {
      id: string;
      name: string;
      email: string;
      phone: string;
      company: string;
    };
  };
  viewingDetails: {
    date: string;
    time: string;
    preference: string;
    userDetails: {
      fullName: string;
      email: string;
      phoneNumber: string;
    };
  };
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  confirmedAt?: Timestamp;
  completedAt?: Timestamp;
  cancelledAt?: Timestamp;
  rescheduledAt?: Timestamp;
  notes?: string;
  agentNotes?: string;
}

export interface ViewingStats {
  upcoming: number;
  completed: number;
  rescheduled: number;
  total: number;
}

class ViewingService {
  private readonly collectionName = 'viewingBookings';

  /**
   * Save a new viewing booking to Firestore
   */
  async saveViewingBooking(
    userId: string,
    property: ViewingBooking['property'],
    viewingDetails: ViewingBooking['viewingDetails'],
    propertyId?: string
  ): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    try {
      // Check if we're online
      if (!navigator.onLine) {
        console.warn('⚠️ Device is offline, viewing booking will be saved when connection is restored');
        return { 
          success: false, 
          error: 'Device is offline. Viewing booking will be saved when connection is restored.' 
        };
      }

      const bookingId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const docRef = doc(db, this.collectionName, bookingId);
      
      const bookingData: ViewingBooking = {
        id: bookingId,
        userId,
        propertyId: propertyId || null, // Handle undefined propertyId
        property,
        viewingDetails,
        status: 'pending',
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      await setDoc(docRef, bookingData);
      
      console.log('✅ Viewing booking saved to Firestore successfully');
      return { success: true, bookingId };
    } catch (error: any) {
      console.error('❌ Error saving viewing booking to Firestore:', error);
      
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
   * Get all viewing bookings for a user
   */
  async getUserViewingBookings(userId: string): Promise<{ success: boolean; bookings?: ViewingBooking[]; error?: string }> {
    try {
      console.log('Getting user viewing bookings for userId:', userId);
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const bookings: ViewingBooking[] = [];
      
      console.log('Query snapshot size:', querySnapshot.size);
      querySnapshot.forEach((doc) => {
        console.log('Found document:', doc.id, doc.data());
        bookings.push(doc.data() as ViewingBooking);
      });
      
      console.log('Retrieved bookings:', bookings);
      return { success: true, bookings };
    } catch (error) {
      console.error('❌ Error getting user viewing bookings:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get viewing bookings by status
   */
  async getViewingBookingsByStatus(
    userId: string, 
    status: ViewingBooking['status']
  ): Promise<{ success: boolean; bookings?: ViewingBooking[]; error?: string }> {
    try {
      console.log(`Getting viewing bookings for userId: ${userId}, status: ${status}`);
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const bookings: ViewingBooking[] = [];
      
      console.log(`Query snapshot size for status ${status}:`, querySnapshot.size);
      querySnapshot.forEach((doc) => {
        console.log(`Found document for status ${status}:`, doc.id, doc.data());
        bookings.push(doc.data() as ViewingBooking);
      });
      
      console.log(`Retrieved bookings for status ${status}:`, bookings);
      return { success: true, bookings };
    } catch (error) {
      console.error('❌ Error getting viewing bookings by status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Update viewing booking status
   */
  async updateViewingStatus(
    bookingId: string,
    status: ViewingBooking['status'],
    notes?: string,
    agentNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, this.collectionName, bookingId);
      const updateData: any = {
        status,
        updatedAt: serverTimestamp()
      };

      // Add timestamp based on status
      switch (status) {
        case 'confirmed':
          updateData.confirmedAt = serverTimestamp();
          break;
        case 'completed':
          updateData.completedAt = serverTimestamp();
          break;
        case 'cancelled':
          updateData.cancelledAt = serverTimestamp();
          break;
        case 'rescheduled':
          updateData.rescheduledAt = serverTimestamp();
          break;
      }

      if (notes) updateData.notes = notes;
      if (agentNotes) updateData.agentNotes = agentNotes;

      await updateDoc(docRef, updateData);
      
      console.log(`✅ Viewing booking status updated to ${status}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating viewing status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get viewing statistics for a user
   */
  async getViewingStats(userId: string): Promise<{ success: boolean; stats?: ViewingStats; error?: string }> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const stats: ViewingStats = {
        upcoming: 0,
        completed: 0,
        rescheduled: 0,
        total: 0
      };
      
      querySnapshot.forEach((doc) => {
        const booking = doc.data() as ViewingBooking;
        stats.total++;
        
        switch (booking.status) {
          case 'pending':
          case 'confirmed':
            stats.upcoming++;
            break;
          case 'completed':
            stats.completed++;
            break;
          case 'rescheduled':
            stats.rescheduled++;
            break;
        }
      });
      
      return { success: true, stats };
    } catch (error) {
      console.error('❌ Error getting viewing stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Delete a viewing booking
   */
  async deleteViewingBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, this.collectionName, bookingId);
      await deleteDoc(docRef);
      
      console.log('✅ Viewing booking deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting viewing booking:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Subscribe to real-time updates for user viewing bookings
   */
  subscribeToUserViewingBookings(
    userId: string,
    callback: (bookings: ViewingBooking[]) => void,
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
        const bookings: ViewingBooking[] = [];
        querySnapshot.forEach((doc) => {
          bookings.push(doc.data() as ViewingBooking);
        });
        callback(bookings);
      },
      (error) => {
        console.error('❌ Error in viewing bookings subscription:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  }

  /**
   * Subscribe to real-time updates for viewing stats
   */
  subscribeToViewingStats(
    userId: string,
    callback: (stats: ViewingStats) => void,
    onError?: (error: Error) => void
  ): () => void {
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId)
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const stats: ViewingStats = {
          upcoming: 0,
          completed: 0,
          rescheduled: 0,
          total: 0
        };
        
        querySnapshot.forEach((doc) => {
          const booking = doc.data() as ViewingBooking;
          stats.total++;
          
          switch (booking.status) {
            case 'pending':
            case 'confirmed':
              stats.upcoming++;
              break;
            case 'completed':
              stats.completed++;
              break;
            case 'rescheduled':
              stats.rescheduled++;
              break;
          }
        });
        
        callback(stats);
      },
      (error) => {
        console.error('❌ Error in viewing stats subscription:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  }
}

export const viewingService = new ViewingService();
export default viewingService;
