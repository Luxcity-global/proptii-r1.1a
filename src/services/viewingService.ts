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

const getTimestampMs = (ts: any): number => {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.toDate === 'function') return ts.toDate().getTime();
  if (typeof ts.getTime === 'function') return ts.getTime();
  if (ts.seconds) return ts.seconds * 1000;
  const d = new Date(ts);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

const logDev = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

export interface ViewingBooking {
  id: string;
  userId: string;
  propertyId?: string | null;
  landlordId?: string | null;
  agentId?: string | null;
  agentEmail?: string | null; // OPTIMIZATION: Top-level field for fast queries
  property: {
    street: string;
    town?: string;
    city?: string;
    postcode?: string;
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
    whatsappNumber?: string;
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
    propertyId?: string,
    managerInfo?: {
      landlordId?: string | null;
      agentId?: string | null;
    }
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
        landlordId: managerInfo?.landlordId ?? property.agent?.id ?? null,
        agentId: managerInfo?.agentId ?? property.agent?.id ?? null,
        agentEmail: property.agent?.email?.toLowerCase().trim() || null, // OPTIMIZATION: Denormalize for fast queries
        property,
        viewingDetails,
        status: 'pending',
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      await setDoc(docRef, bookingData);

      logDev('✅ Viewing booking saved to Firestore successfully');
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

  private async getViewingsByManagerField(
    field: 'landlordId' | 'agentId',
    managerId: string,
    status?: ViewingBooking['status']
  ): Promise<ViewingBooking[]> {
    try {
      const constraints: any[] = [
        where(field, '==', managerId)
      ];

      if (status) {
        constraints.push(where('status', '==', status));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      const q = query(collection(db, this.collectionName), ...constraints);
      const snapshot = await getDocs(q);
      const bookings: ViewingBooking[] = [];
      snapshot.forEach((doc) => bookings.push(doc.data() as ViewingBooking));
      return bookings;
    } catch (error: any) {
      // Fallback without orderBy if index is missing
      if (error.code === 'failed-precondition' && error.message?.includes('index')) {
        const fallbackConstraints = [where(field, '==', managerId)];
        if (status) {
          fallbackConstraints.push(where('status', '==', status));
        }
        const fallbackQuery = query(collection(db, this.collectionName), ...fallbackConstraints);
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const bookings: ViewingBooking[] = [];
        fallbackSnapshot.forEach((doc) => bookings.push(doc.data() as ViewingBooking));
        // Sort in memory since we removed orderBy
        return bookings.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
      }
      console.error('❌ Error fetching manager viewings:', error);
      throw error;
    }
  }

  private mergeViewingsById(...lists: ViewingBooking[][]): ViewingBooking[] {
    const map = new Map<string, ViewingBooking>();
    lists.flat().forEach((booking) => {
      if (!map.has(booking.id)) {
        map.set(booking.id, booking);
      }
    });
    return Array.from(map.values()).sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
  }

  /**
   * Get all viewing bookings for a user
   */
  async getUserViewingBookings(userId: string): Promise<{ success: boolean; bookings?: ViewingBooking[]; error?: string }> {
    try {
      logDev('Getting user viewing bookings for userId:', userId);
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const bookings: ViewingBooking[] = [];

      logDev('Query snapshot size:', querySnapshot.size);
      querySnapshot.forEach((doc) => {
        logDev('Found document:', doc.id, doc.data());
        bookings.push(doc.data() as ViewingBooking);
      });

      logDev('Retrieved bookings:', bookings);
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
      logDev(`Getting viewing bookings for userId: ${userId}, status: ${status}`);
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const bookings: ViewingBooking[] = [];

      logDev(`Query snapshot size for status ${status}:`, querySnapshot.size);
      querySnapshot.forEach((doc) => {
        logDev(`Found document for status ${status}:`, doc.id, doc.data());
        bookings.push(doc.data() as ViewingBooking);
      });

      logDev(`Retrieved bookings for status ${status}:`, bookings);
      return { success: true, bookings };
    } catch (error) {
      console.error('❌ Error getting viewing bookings by status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getManagerViewingBookings(managerId: string): Promise<{ success: boolean; bookings?: ViewingBooking[]; error?: string }> {
    try {
      const landlordBookings = await this.getViewingsByManagerField('landlordId', managerId);
      const agentBookings = await this.getViewingsByManagerField('agentId', managerId);
      const bookings = this.mergeViewingsById(landlordBookings, agentBookings);
      return { success: true, bookings };
    } catch (error) {
      console.error('❌ Error getting manager viewing bookings:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getManagerViewingBookingsByStatus(
    managerId: string,
    status: ViewingBooking['status']
  ): Promise<{ success: boolean; bookings?: ViewingBooking[]; error?: string }> {
    try {
      const landlordBookings = await this.getViewingsByManagerField('landlordId', managerId, status);
      const agentBookings = await this.getViewingsByManagerField('agentId', managerId, status);
      const bookings = this.mergeViewingsById(landlordBookings, agentBookings);
      return { success: true, bookings };
    } catch (error) {
      console.error('❌ Error getting manager viewing bookings by status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private calculateStatsFromBookings(bookings: ViewingBooking[]): ViewingStats {
    return bookings.reduce<ViewingStats>((stats, booking) => {
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
      return stats;
    }, {
      upcoming: 0,
      completed: 0,
      rescheduled: 0,
      total: 0
    });
  }

  async getManagerViewingStats(managerId: string): Promise<{ success: boolean; stats?: ViewingStats; error?: string }> {
    try {
      const { success, bookings, error } = await this.getManagerViewingBookings(managerId);
      if (!success || !bookings) {
        return { success: false, error };
      }
      const stats = this.calculateStatsFromBookings(bookings);
      return { success: true, stats };
    } catch (error) {
      console.error('❌ Error getting manager viewing stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get viewing bookings filtered by agent email
   * This allows filtering by the signed-in user's email to show only their requests
   */
  async getViewingBookingsByEmail(agentEmail: string): Promise<{ success: boolean; bookings?: ViewingBooking[]; error?: string }> {
    try {
      // Normalize email to lowercase for comparison (emails are case-insensitive)
      const normalizedEmail = agentEmail?.toLowerCase().trim();

      // OPTIMIZATION: Try top-level agentEmail field first (much faster than nested field query)
      // This works for new documents. For backward compatibility, we'll also check nested field.
      let q = query(
        collection(db, this.collectionName),
        where('agentEmail', '==', normalizedEmail),
        orderBy('createdAt', 'desc')
      );

      let querySnapshot;
      try {
        querySnapshot = await getDocs(q);
        // If no results with top-level field, try nested field query for backward compatibility
        if (querySnapshot.empty) {
          const nestedQ = query(
            collection(db, this.collectionName),
            where('property.agent.email', '==', normalizedEmail)
          );
          querySnapshot = await getDocs(nestedQ);
        }
      } catch (indexError: any) {
        // If index is missing, try fallback to nested field query
        if (indexError.code === 'failed-precondition' && indexError.message?.includes('index')) {
          // Fallback: Query by nested field (slower, but works for old documents)
          const nestedQ = query(
            collection(db, this.collectionName),
            where('property.agent.email', '==', normalizedEmail)
          );
          querySnapshot = await getDocs(nestedQ);
        } else {
          throw indexError;
        }
      }

      const bookings: ViewingBooking[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data() as ViewingBooking;
        bookings.push(data);
      });

      // If we used nested field query, filter and sort in memory
      if (bookings.length > 0 && !bookings[0].agentEmail) {
        // Filter by email in case some documents don't match
        const filtered = bookings.filter(b =>
          b.agentEmail?.toLowerCase() === normalizedEmail ||
          b.property?.agent?.email?.toLowerCase() === normalizedEmail
        );
        // Sort by createdAt descending
        const sorted = filtered.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
        return { success: true, bookings: sorted };
      }

      return { success: true, bookings };
    } catch (error: any) {
      // Final fallback: query without orderBy and sort in memory
      if (error.code === 'failed-precondition' && error.message?.includes('index')) {
        const normalizedEmail = agentEmail?.toLowerCase().trim();
        const fallbackQuery = query(
          collection(db, this.collectionName),
          where('agentEmail', '==', normalizedEmail)
        );
        try {
          const fallbackSnapshot = await getDocs(fallbackQuery);
          const bookings: ViewingBooking[] = [];
          fallbackSnapshot.forEach((doc) => {
            const data = doc.data() as ViewingBooking;
            if (data.agentEmail?.toLowerCase() === normalizedEmail ||
              data.property?.agent?.email?.toLowerCase() === normalizedEmail) {
              bookings.push(data);
            }
          });
          const sorted = bookings.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
          return { success: true, bookings: sorted };
        } catch {
          // Last resort: get all and filter in memory (very slow, but works)
          const allQuery = query(collection(db, this.collectionName));
          const allSnapshot = await getDocs(allQuery);
          const bookings: ViewingBooking[] = [];
          allSnapshot.forEach((doc) => {
            const data = doc.data() as ViewingBooking;
            if (data.agentEmail?.toLowerCase() === normalizedEmail ||
              data.property?.agent?.email?.toLowerCase() === normalizedEmail) {
              bookings.push(data);
            }
          });
          const sorted = bookings.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
          return { success: true, bookings: sorted };
        }
      }

      console.error('Error getting viewing bookings by email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get viewing bookings by agent email and status
   */
  async getViewingBookingsByEmailAndStatus(
    agentEmail: string,
    status: ViewingBooking['status']
  ): Promise<{ success: boolean; bookings?: ViewingBooking[]; error?: string }> {
    try {
      const normalizedEmail = agentEmail?.toLowerCase().trim();
      logDev(`🔍 Getting viewing bookings for email: ${normalizedEmail}, status: ${status}`);
      const q = query(
        collection(db, this.collectionName),
        where('property.agent.email', '==', normalizedEmail),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const bookings: ViewingBooking[] = [];

      querySnapshot.forEach((doc) => {
        bookings.push(doc.data() as ViewingBooking);
      });

      return { success: true, bookings };
    } catch (error: any) {
      // Fallback without orderBy if index is missing
      if (error.code === 'failed-precondition' && error.message?.includes('index')) {
        const normalizedEmail = agentEmail?.toLowerCase().trim();
        const fallbackQuery = query(
          collection(db, this.collectionName),
          where('property.agent.email', '==', normalizedEmail),
          where('status', '==', status)
        );
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const bookings: ViewingBooking[] = [];
        fallbackSnapshot.forEach((doc) => bookings.push(doc.data() as ViewingBooking));
        const sorted = bookings.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
        return { success: true, bookings: sorted };
      }
      console.error('❌ Error getting viewing bookings by email and status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get viewing statistics filtered by agent email
   */
  async getViewingStatsByEmail(agentEmail: string): Promise<{ success: boolean; stats?: ViewingStats; error?: string }> {
    try {
      const { success, bookings, error } = await this.getViewingBookingsByEmail(agentEmail);
      if (!success || !bookings) {
        return { success: false, error };
      }
      const stats = this.calculateStatsFromBookings(bookings);
      return { success: true, stats };
    } catch (error) {
      console.error('❌ Error getting viewing stats by email:', error);
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
    agentNotes?: string,
    updates?: {
      viewingDetails?: ViewingBooking['viewingDetails'];
    }
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
      if (updates?.viewingDetails) updateData.viewingDetails = updates.viewingDetails;

      await updateDoc(docRef, updateData);

      logDev(`✅ Viewing booking status updated to ${status}`);
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

      logDev('✅ Viewing booking deleted successfully');
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
    let unsubscribe: () => void = () => {};

    const setupListener = (useOrderBy: boolean) => {
      const q = useOrderBy
        ? query(
            collection(db, this.collectionName),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
          )
        : query(
            collection(db, this.collectionName),
            where('userId', '==', userId)
          );

      unsubscribe = onSnapshot(
        q,
        (querySnapshot: any) => {
          const bookings: ViewingBooking[] = [];
          querySnapshot.forEach((doc: any) => {
            bookings.push(doc.data() as ViewingBooking);
          });
          if (!useOrderBy) {
            // Sort in memory by createdAt descending
            bookings.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
          }
          callback(bookings);
        },
        (error: any) => {
          if (useOrderBy && (error.code === 'failed-precondition' || error.message?.includes('index'))) {
            console.warn('⚠️ User viewing bookings ordered listener failed, falling back to unordered listener...');
            setupListener(false);
          } else {
            console.error('❌ Error in viewing bookings subscription:', error);
            if (onError) onError(error);
          }
        }
      );
    };

    setupListener(true);
    return () => unsubscribe();
  }

  subscribeToManagerViewingBookings(
    managerId: string,
    callback: (bookings: ViewingBooking[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const landlordMap = new Map<string, ViewingBooking>();
    const agentMap = new Map<string, ViewingBooking>();

    const emit = () => {
      const bookings = this.mergeViewingsById(
        Array.from(landlordMap.values()),
        Array.from(agentMap.values())
      );
      callback(bookings);
    };

    let unsubscribeLandlord: () => void = () => {};
    let unsubscribeAgent: () => void = () => {};

    const setupLandlordListener = (useOrderBy: boolean) => {
      const q = useOrderBy
        ? query(
            collection(db, this.collectionName),
            where('landlordId', '==', managerId),
            orderBy('createdAt', 'desc')
          )
        : query(
            collection(db, this.collectionName),
            where('landlordId', '==', managerId)
          );

      unsubscribeLandlord = onSnapshot(
        q,
        (snapshot) => {
          landlordMap.clear();
          snapshot.forEach((doc) => {
            const data = doc.data() as ViewingBooking;
            landlordMap.set(doc.id, data);
          });
          emit();
        },
        (error: any) => {
          if (useOrderBy && (error.code === 'failed-precondition' || error.message?.includes('index'))) {
            console.warn('⚠️ Landlord viewing bookings ordered listener failed, falling back...');
            setupLandlordListener(false);
          } else {
            console.error('❌ Error in landlord viewing subscription:', error);
            if (onError) onError(error);
          }
        }
      );
    };

    const setupAgentListener = (useOrderBy: boolean) => {
      const q = useOrderBy
        ? query(
            collection(db, this.collectionName),
            where('agentId', '==', managerId),
            orderBy('createdAt', 'desc')
          )
        : query(
            collection(db, this.collectionName),
            where('agentId', '==', managerId)
          );

      unsubscribeAgent = onSnapshot(
        q,
        (snapshot) => {
          agentMap.clear();
          snapshot.forEach((doc) => {
            const data = doc.data() as ViewingBooking;
            agentMap.set(doc.id, data);
          });
          emit();
        },
        (error: any) => {
          if (useOrderBy && (error.code === 'failed-precondition' || error.message?.includes('index'))) {
            console.warn('⚠️ Agent viewing bookings ordered listener failed, falling back...');
            setupAgentListener(false);
          } else {
            console.error('❌ Error in agent viewing subscription:', error);
            if (onError) onError(error);
          }
        }
      );
    };

    setupLandlordListener(true);
    setupAgentListener(true);

    return () => {
      unsubscribeLandlord();
      unsubscribeAgent();
    };
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

  subscribeToManagerViewingStats(
    managerId: string,
    callback: (stats: ViewingStats) => void,
    onError?: (error: Error) => void
  ): () => void {
    const landlordMap = new Map<string, ViewingBooking>();
    const agentMap = new Map<string, ViewingBooking>();

    const emit = () => {
      const bookings = this.mergeViewingsById(
        Array.from(landlordMap.values()),
        Array.from(agentMap.values())
      );
      callback(this.calculateStatsFromBookings(bookings));
    };

    const handleError = (error: Error) => {
      console.error('❌ Error in manager viewing stats subscription:', error);
      if (onError) {
        onError(error);
      }
    };

    const landlordQuery = query(
      collection(db, this.collectionName),
      where('landlordId', '==', managerId)
    );

    const agentQuery = query(
      collection(db, this.collectionName),
      where('agentId', '==', managerId)
    );

    const unsubscribeLandlord = onSnapshot(
      landlordQuery,
      (snapshot) => {
        landlordMap.clear();
        snapshot.forEach((doc) => landlordMap.set(doc.id, doc.data() as ViewingBooking));
        emit();
      },
      handleError
    );

    const unsubscribeAgent = onSnapshot(
      agentQuery,
      (snapshot) => {
        agentMap.clear();
        snapshot.forEach((doc) => agentMap.set(doc.id, doc.data() as ViewingBooking));
        emit();
      },
      handleError
    );

    return () => {
      unsubscribeLandlord();
      unsubscribeAgent();
    };
  }

  /**
   * Subscribe to real-time updates for viewing bookings filtered by agent email
   */
  subscribeToViewingBookingsByEmail(
    agentEmail: string,
    callback: (bookings: ViewingBooking[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const normalizedEmail = agentEmail?.toLowerCase().trim();
    let unsubscribe: () => void = () => {};

    const setupListener = (step: 'ordered' | 'unordered' | 'nested') => {
      let q;
      if (step === 'ordered') {
        q = query(
          collection(db, this.collectionName),
          where('agentEmail', '==', normalizedEmail),
          orderBy('createdAt', 'desc')
        );
      } else if (step === 'unordered') {
        q = query(
          collection(db, this.collectionName),
          where('agentEmail', '==', normalizedEmail)
        );
      } else {
        q = query(
          collection(db, this.collectionName),
          where('property.agent.email', '==', normalizedEmail)
        );
      }

      unsubscribe = onSnapshot(
        q,
        (querySnapshot: any) => {
          const bookings: ViewingBooking[] = [];
          querySnapshot.forEach((doc: any) => {
            const data = doc.data() as ViewingBooking;
            if (step === 'nested') {
              if (data.property?.agent?.email?.toLowerCase() === normalizedEmail) {
                bookings.push(data);
              }
            } else {
              if (data.agentEmail?.toLowerCase() === normalizedEmail ||
                data.property?.agent?.email?.toLowerCase() === normalizedEmail) {
                bookings.push(data);
              }
            }
          });
          
          if (step !== 'ordered') {
            bookings.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
          }
          callback(bookings);
        },
        (error: any) => {
          if (error.code === 'failed-precondition' || error.message?.includes('index')) {
            if (step === 'ordered') {
              console.warn('⚠️ top-level agentEmail ordered query failed, falling back to unordered...');
              setupListener('unordered');
            } else if (step === 'unordered') {
              console.warn('⚠️ top-level agentEmail unordered query failed, falling back to nested...');
              setupListener('nested');
            } else {
              console.error('❌ All fallback queries failed for viewing bookings by email:', error);
              if (onError) onError(error);
            }
          } else {
            console.error('Error in viewing bookings subscription:', error);
            if (onError) onError(error);
          }
        }
      );
    };

    setupListener('ordered');
    return () => unsubscribe();
  }

  /**
   * Subscribe to real-time updates for viewing stats filtered by agent email
   */
  subscribeToViewingStatsByEmail(
    agentEmail: string,
    callback: (stats: ViewingStats) => void,
    onError?: (error: Error) => void
  ): () => void {
    const normalizedEmail = agentEmail?.toLowerCase().trim();
    // OPTIMIZATION: Use top-level agentEmail field
    const q = query(
      collection(db, this.collectionName),
      where('agentEmail', '==', normalizedEmail)
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
          // Filter to ensure we only count matching bookings
          if (booking.agentEmail?.toLowerCase() === normalizedEmail ||
            booking.property?.agent?.email?.toLowerCase() === normalizedEmail) {
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
          }
        });

        callback(stats);
      },
      (error) => {
        // Fallback to nested field query
        if (error.code === 'failed-precondition' || error.message?.includes('index')) {
          const fallbackQ = query(
            collection(db, this.collectionName),
            where('property.agent.email', '==', normalizedEmail)
          );
          return onSnapshot(
            fallbackQ,
            (querySnapshot) => {
              const stats: ViewingStats = {
                upcoming: 0,
                completed: 0,
                rescheduled: 0,
                total: 0
              };

              querySnapshot.forEach((doc) => {
                const booking = doc.data() as ViewingBooking;
                if (booking.property?.agent?.email?.toLowerCase() === normalizedEmail) {
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
                }
              });

              callback(stats);
            },
            (fallbackError) => {
              console.error('Error in viewing stats subscription:', fallbackError);
              if (onError) {
                onError(fallbackError);
              }
            }
          );
        }
        console.error('Error in viewing stats subscription:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  }
}

export const viewingService = new ViewingService();
export default viewingService;
