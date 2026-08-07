import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  deleteDoc
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

export interface BookViewingRequest {
  id: string;
  userId: string;
  propertyId: string;
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
  status: 'requested';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

class BookViewingRequestService {
  private readonly collectionName = 'bookViewingRequests';

  async saveRequest(
    userId: string,
    propertyId: string,
    property: BookViewingRequest['property'],
    managerInfo?: {
      landlordId?: string | null;
      agentId?: string | null;
    }
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      if (!navigator.onLine) {
        return { success: false, error: 'Offline' };
      }

      const requestId = `${userId}_${propertyId}_${Date.now()}`;
      const docRef = doc(db, this.collectionName, requestId);

      const payload: BookViewingRequest = {
        id: requestId,
        userId,
        propertyId,
        landlordId: managerInfo?.landlordId ?? property.agent?.id ?? null,
        agentId: managerInfo?.agentId ?? property.agent?.id ?? null,
        agentEmail: property.agent?.email?.toLowerCase().trim() || null, // OPTIMIZATION: Denormalize for fast queries
        property,
        status: 'requested',
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      await setDoc(docRef, payload);
      return { success: true, requestId };
    } catch (error: any) {
      console.error('Error saving book viewing request:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  async getUserRequests(userId: string): Promise<{ success: boolean; requests?: BookViewingRequest[]; error?: string }> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const out: BookViewingRequest[] = [];
      snap.forEach(d => out.push(d.data() as BookViewingRequest));
      return { success: true, requests: out };
    } catch (error: any) {
      console.error('Error getting book viewing requests:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  private async getRequestsByManagerField(
    field: 'landlordId' | 'agentId',
    managerId: string
  ): Promise<BookViewingRequest[]> {
    try {
      logDev(`🔍 Querying ${this.collectionName} by ${field} = ${managerId}`);
      const q = query(
        collection(db, this.collectionName),
        where(field, '==', managerId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      logDev(`📊 Found ${snap.size} requests for ${field} = ${managerId}`);
      const out: BookViewingRequest[] = [];
      snap.forEach(d => {
        const data = d.data() as BookViewingRequest;
        out.push(data);
        logDev(`📋 Request found:`, {
          id: data.id,
          landlordId: data.landlordId,
          agentId: data.agentId,
          propertyStreet: data.property?.street
        });
      });
      return out;
    } catch (error: any) {
      // Handle missing index error
      if (error.code === 'failed-precondition' && error.message?.includes('index')) {
        console.warn(`⚠️ Firestore index missing for ${field} query, trying without orderBy...`);
        // Fallback: query without orderBy
        const fallbackQ = query(
          collection(db, this.collectionName),
          where(field, '==', managerId)
        );
        const fallbackSnap = await getDocs(fallbackQ);
        const out: BookViewingRequest[] = [];
        fallbackSnap.forEach(d => out.push(d.data() as BookViewingRequest));
        // Sort in memory
        return out.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      }
      console.error(`❌ Error querying ${field}:`, error);
      throw error;
    }
  }

  private mergeRequestsById(...lists: BookViewingRequest[][]): BookViewingRequest[] {
    const map = new Map<string, BookViewingRequest>();
    lists.flat().forEach((req) => {
      if (!map.has(req.id)) {
        map.set(req.id, req);
      }
    });
    return Array.from(map.values()).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  }

  /**
   * Get all viewing requests from bookViewingRequests collection for a specific landlord/manager
   * Queries by both landlordId and agentId to catch all relevant requests
   */
  async getManagerRequests(managerId: string): Promise<{ success: boolean; requests?: BookViewingRequest[]; error?: string }> {
    try {
      logDev(`🔍 [bookViewingRequests] getManagerRequests called with managerId: ${managerId}`);
      logDev(`🔍 [bookViewingRequests] Collection: ${this.collectionName}`);
      logDev(`🔍 [bookViewingRequests] Querying by landlordId = ${managerId}`);
      
      // Query by landlordId first (primary query for bookViewingRequests)
      const landlordRequests = await this.getRequestsByManagerField('landlordId', managerId);
      logDev(`✅ [bookViewingRequests] Found ${landlordRequests.length} requests by landlordId`);
      
      // Also query by agentId as fallback (some records might only have agentId set)
      logDev(`🔍 [bookViewingRequests] Also querying by agentId = ${managerId}`);
      const agentRequests = await this.getRequestsByManagerField('agentId', managerId);
      logDev(`✅ [bookViewingRequests] Found ${agentRequests.length} requests by agentId`);
      
      // Merge and deduplicate requests
      const requests = this.mergeRequestsById(landlordRequests, agentRequests);
      logDev(`✅ [bookViewingRequests] Total merged requests: ${requests.length}`);
      
      if (requests.length > 0) {
        logDev(`📋 [bookViewingRequests] Request details:`);
        requests.forEach((req, index) => {
          logDev(`  ${index + 1}. ID: ${req.id}, landlordId: ${req.landlordId}, agentId: ${req.agentId}, property: ${req.property?.street}`);
        });
      }
      
      return { success: true, requests };
    } catch (error: any) {
      console.error('❌ [bookViewingRequests] Error getting manager viewing requests:', error);
      console.error('❌ [bookViewingRequests] Error details:', {
        code: error.code,
        message: error.message,
        managerId,
        collectionName: this.collectionName
      });
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  /**
   * Get viewing requests filtered by agent email
   * This allows filtering by the signed-in user's email to show only their requests
   */
  async getRequestsByEmail(agentEmail: string): Promise<{ success: boolean; requests?: BookViewingRequest[]; error?: string }> {
    try {
      // Normalize email to lowercase for comparison (emails are case-insensitive)
      const normalizedEmail = agentEmail?.toLowerCase().trim();
      logDev('🔍 Getting viewing requests for agent email:', normalizedEmail);
      logDev('🔍 Collection name:', this.collectionName);
      
      // OPTIMIZATION: Try top-level agentEmail field first (much faster than nested field query)
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
          logDev('⚠️ No results with top-level agentEmail field, trying nested field query...');
          const nestedQ = query(
            collection(db, this.collectionName),
            where('property.agent.email', '==', normalizedEmail),
            orderBy('createdAt', 'desc')
          );
          querySnapshot = await getDocs(nestedQ);
        }
      } catch (indexError: any) {
        // If index is missing, try fallback to nested field query
        if (indexError.code === 'failed-precondition' && indexError.message?.includes('index')) {
          console.warn('⚠️ Firestore index missing, falling back to nested field query');
          const nestedQ = query(
            collection(db, this.collectionName),
            where('property.agent.email', '==', normalizedEmail)
          );
          querySnapshot = await getDocs(nestedQ);
        } else {
          throw indexError;
        }
      }
      
      logDev('🔍 Query completed! Snapshot size:', querySnapshot.size);
      logDev('🔍 Query empty?', querySnapshot.empty);
      
      const requests: BookViewingRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as BookViewingRequest;
        // Filter to ensure we only include matching requests (for backward compatibility)
        if (data.agentEmail?.toLowerCase() === normalizedEmail || 
            data.property?.agent?.email?.toLowerCase() === normalizedEmail) {
          requests.push(data);
          logDev('📋 Found request:', {
            id: data.id,
            agentEmail: data.agentEmail || data.property?.agent?.email,
            propertyStreet: data.property?.street
          });
        }
      });
      
      // Sort by createdAt if not already sorted
      if (requests.length > 0 && !requests[0].agentEmail) {
        requests.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      }
      
      logDev(`✅✅✅ Retrieved ${requests.length} requests for email: ${normalizedEmail} ✅✅✅`);
      return { success: true, requests };
    } catch (error: any) {
      // Final fallback: query without orderBy and sort in memory
      if (error.code === 'failed-precondition' && error.message?.includes('index')) {
        console.warn('⚠️ Firestore index missing, trying final fallback without orderBy');
        const normalizedEmail = agentEmail?.toLowerCase().trim();
        const fallbackQuery = query(
          collection(db, this.collectionName),
          where('property.agent.email', '==', normalizedEmail)
        );
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const requests: BookViewingRequest[] = [];
        fallbackSnapshot.forEach((doc) => {
          const data = doc.data() as BookViewingRequest;
          if (data.agentEmail?.toLowerCase() === normalizedEmail || 
              data.property?.agent?.email?.toLowerCase() === normalizedEmail) {
            requests.push(data);
            logDev('📋 Found request (fallback):', {
              id: data.id,
              agentEmail: data.agentEmail || data.property?.agent?.email,
              propertyStreet: data.property?.street
            });
          }
        });
        // Sort in memory
        const sorted = requests.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        logDev(`✅ Retrieved ${sorted.length} requests (fallback) for email: ${normalizedEmail}`);
        return { success: true, requests: sorted };
      }
      console.error('❌ Error getting viewing requests by email:', error);
      console.error('❌ Error details:', {
        code: error.code,
        message: error.message,
        collectionName: this.collectionName,
        email: agentEmail
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  subscribeToUserRequests(
    userId: string,
    callback: (requests: BookViewingRequest[]) => void,
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
        (snap) => {
          const out: BookViewingRequest[] = [];
          snap.forEach(d => out.push(d.data() as BookViewingRequest));
          
          if (!useOrderBy) {
            // Sort in memory by createdAt descending
            out.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
          }
          callback(out);
        },
        (err: any) => {
          if (useOrderBy && (err.code === 'failed-precondition' || err.message?.includes('index'))) {
            console.warn('⚠️ User requests ordered listener failed, falling back to unordered listener...');
            setupListener(false);
          } else {
            console.error('Error in requests subscription:', err);
            if (onError) onError(err as any);
          }
        }
      );
    };

    setupListener(true);
    return () => unsubscribe();
  }

  subscribeToManagerRequests(
    managerId: string,
    callback: (requests: BookViewingRequest[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const landlordMap = new Map<string, BookViewingRequest>();
    const agentMap = new Map<string, BookViewingRequest>();

    const emit = () => {
      const requests = this.mergeRequestsById(
        Array.from(landlordMap.values()),
        Array.from(agentMap.values())
      );
      callback(requests);
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
        (snap) => {
          landlordMap.clear();
          snap.forEach(d => landlordMap.set(d.id, d.data() as BookViewingRequest));
          emit();
        },
        (error: any) => {
          if (useOrderBy && (error.code === 'failed-precondition' || error.message?.includes('index'))) {
            console.warn('⚠️ Landlord requests ordered listener failed, falling back...');
            setupLandlordListener(false);
          } else {
            console.error('Error in landlord manager requests subscription:', error);
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
        (snap) => {
          agentMap.clear();
          snap.forEach(d => agentMap.set(d.id, d.data() as BookViewingRequest));
          emit();
        },
        (error: any) => {
          if (useOrderBy && (error.code === 'failed-precondition' || error.message?.includes('index'))) {
            console.warn('⚠️ Agent requests ordered listener failed, falling back...');
            setupAgentListener(false);
          } else {
            console.error('Error in agent manager requests subscription:', error);
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
   * Subscribe to real-time updates for viewing requests filtered by agent email
   */
  subscribeToRequestsByEmail(
    agentEmail: string,
    callback: (requests: BookViewingRequest[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const normalizedEmail = agentEmail?.toLowerCase().trim();
    logDev('🔔 Subscribing to viewing requests for email:', normalizedEmail);
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
          const requests: BookViewingRequest[] = [];
          querySnapshot.forEach((doc: any) => {
            const data = doc.data() as BookViewingRequest;
            if (step === 'nested') {
              if (data.property?.agent?.email?.toLowerCase() === normalizedEmail) {
                requests.push(data);
              }
            } else {
              if (data.agentEmail?.toLowerCase() === normalizedEmail ||
                data.property?.agent?.email?.toLowerCase() === normalizedEmail) {
                requests.push(data);
              }
            }
          });
          
          if (step !== 'ordered') {
            requests.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
          }
          callback(requests);
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
              console.error('❌ All fallback queries failed for viewing requests by email:', error);
              if (onError) onError(error);
            }
          } else {
            console.error('Error in viewing requests subscription:', error);
            if (onError) onError(error);
          }
        }
      );
    };

    setupListener('ordered');
    return () => unsubscribe();
  }

  async deleteRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, this.collectionName, requestId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting viewing request:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }
}

export const bookViewingRequestService = new BookViewingRequestService();
export default bookViewingRequestService;



