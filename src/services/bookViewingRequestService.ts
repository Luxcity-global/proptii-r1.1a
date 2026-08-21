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
import { normalizeViewingProperty } from './viewingService';

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
    title?: string;
    description?: string;
    imageUrls?: string[];
    agent: {
      id: string;
      name: string;
      email: string;
      phone: string;
      company: string;
    };
  };
  status: 'requested';
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
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
    },
    applicant?: {
      name?: string;
      email?: string;
      phone?: string;
    }
  ): Promise<{ success: boolean; requestId?: string; error?: string }> {
    try {
      if (!navigator.onLine) {
        return { success: false, error: 'Offline' };
      }

      const requestId = `${userId}_${propertyId}_${Date.now()}`;
      const docRef = doc(db, this.collectionName, requestId);
      const normalizedProperty = normalizeViewingProperty(property);

      const payload: BookViewingRequest = {
        id: requestId,
        userId,
        propertyId,
        landlordId: managerInfo?.landlordId ?? normalizedProperty.agent?.id ?? null,
        agentId: managerInfo?.agentId ?? normalizedProperty.agent?.id ?? null,
        agentEmail: normalizedProperty.agent?.email?.toLowerCase().trim() || null, // OPTIMIZATION: Denormalize for fast queries
        property: normalizedProperty,
        status: 'requested',
        ...(applicant?.name ? { applicantName: applicant.name } : {}),
        ...(applicant?.email ? { applicantEmail: applicant.email.trim().toLowerCase() } : {}),
        ...(applicant?.phone ? { applicantPhone: applicant.phone } : {}),
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
      if (error?.code === 'failed-precondition' || String(error?.message || '').includes('index')) {
        try {
          const fallbackQuery = query(collection(db, this.collectionName), where('userId', '==', userId));
          const fallbackSnap = await getDocs(fallbackQuery);
          const out: BookViewingRequest[] = [];
          fallbackSnap.forEach(d => out.push(d.data() as BookViewingRequest));
          out.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
          return { success: true, requests: out };
        } catch (fallbackError) {
          console.error('Fallback book viewing request query failed:', fallbackError);
        }
      }
      console.error('Error getting book viewing requests:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  private async getRequestsByManagerField(
    field: 'landlordId' | 'agentId',
    managerId: string
  ): Promise<BookViewingRequest[]> {
    try {
      console.log(`🔍 Querying ${this.collectionName} by ${field} = ${managerId}`);
      const q = query(
        collection(db, this.collectionName),
        where(field, '==', managerId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      console.log(`📊 Found ${snap.size} requests for ${field} = ${managerId}`);
      const out: BookViewingRequest[] = [];
      snap.forEach(d => {
        const data = d.data() as BookViewingRequest;
        out.push(data);
        console.log(`📋 Request found:`, {
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
      console.log(`🔍 [bookViewingRequests] getManagerRequests called with managerId: ${managerId}`);
      console.log(`🔍 [bookViewingRequests] Collection: ${this.collectionName}`);
      console.log(`🔍 [bookViewingRequests] Querying by landlordId = ${managerId}`);
      
      // Query by landlordId first (primary query for bookViewingRequests)
      const landlordRequests = await this.getRequestsByManagerField('landlordId', managerId);
      console.log(`✅ [bookViewingRequests] Found ${landlordRequests.length} requests by landlordId`);
      
      // Also query by agentId as fallback (some records might only have agentId set)
      console.log(`🔍 [bookViewingRequests] Also querying by agentId = ${managerId}`);
      const agentRequests = await this.getRequestsByManagerField('agentId', managerId);
      console.log(`✅ [bookViewingRequests] Found ${agentRequests.length} requests by agentId`);
      
      // Merge and deduplicate requests
      const requests = this.mergeRequestsById(landlordRequests, agentRequests);
      console.log(`✅ [bookViewingRequests] Total merged requests: ${requests.length}`);
      
      if (requests.length > 0) {
        console.log(`📋 [bookViewingRequests] Request details:`);
        requests.forEach((req, index) => {
          console.log(`  ${index + 1}. ID: ${req.id}, landlordId: ${req.landlordId}, agentId: ${req.agentId}, property: ${req.property?.street}`);
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
      console.log('🔍 Getting viewing requests for agent email:', normalizedEmail);
      console.log('🔍 Collection name:', this.collectionName);
      
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
          console.log('⚠️ No results with top-level agentEmail field, trying nested field query...');
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
      
      console.log('🔍 Query completed! Snapshot size:', querySnapshot.size);
      console.log('🔍 Query empty?', querySnapshot.empty);
      
      const requests: BookViewingRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as BookViewingRequest;
        // Filter to ensure we only include matching requests (for backward compatibility)
        if (data.agentEmail?.toLowerCase() === normalizedEmail || 
            data.property?.agent?.email?.toLowerCase() === normalizedEmail) {
          requests.push(data);
          console.log('📋 Found request:', {
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
      
      console.log(`✅✅✅ Retrieved ${requests.length} requests for email: ${normalizedEmail} ✅✅✅`);
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
            console.log('📋 Found request (fallback):', {
              id: data.id,
              agentEmail: data.agentEmail || data.property?.agent?.email,
              propertyStreet: data.property?.street
            });
          }
        });
        // Sort in memory
        const sorted = requests.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        console.log(`✅ Retrieved ${sorted.length} requests (fallback) for email: ${normalizedEmail}`);
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
    const emit = (snap: { forEach: (cb: (doc: { data: () => unknown }) => void) => void }) => {
      const out: BookViewingRequest[] = [];
      snap.forEach(d => out.push(d.data() as BookViewingRequest));
      out.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      callback(out);
    };

    const indexedQuery = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    let unsubscribeFallback: (() => void) | null = null;
    const unsubscribeIndexed = onSnapshot(
      indexedQuery,
      emit,
      (err) => {
        console.error('Error in requests subscription:', err);
        const needsFallback =
          (err as { code?: string }).code === 'failed-precondition' ||
          String(err.message || '').includes('index');
        if (needsFallback) {
          const fallbackQuery = query(collection(db, this.collectionName), where('userId', '==', userId));
          unsubscribeFallback = onSnapshot(fallbackQuery, emit, (fallbackError) => {
            console.error('Fallback requests subscription failed:', fallbackError);
            onError?.(fallbackError as Error);
          });
          return;
        }
        onError?.(err as Error);
      }
    );

    return () => {
      unsubscribeIndexed();
      unsubscribeFallback?.();
    };
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

    const handleError = (error: Error) => {
      console.error('Error in manager viewing request subscription:', error);
      if (onError) onError(error);
    };

    const landlordQuery = query(
      collection(db, this.collectionName),
      where('landlordId', '==', managerId),
      orderBy('createdAt', 'desc')
    );

    const agentQuery = query(
      collection(db, this.collectionName),
      where('agentId', '==', managerId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeLandlord = onSnapshot(
      landlordQuery,
      (snap) => {
        landlordMap.clear();
        snap.forEach(d => landlordMap.set(d.id, d.data() as BookViewingRequest));
        emit();
      },
      handleError
    );

    const unsubscribeAgent = onSnapshot(
      agentQuery,
      (snap) => {
        agentMap.clear();
        snap.forEach(d => agentMap.set(d.id, d.data() as BookViewingRequest));
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
   * Subscribe to real-time updates for viewing requests filtered by agent email
   */
  subscribeToRequestsByEmail(
    agentEmail: string,
    callback: (requests: BookViewingRequest[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const normalizedEmail = agentEmail?.toLowerCase().trim();
    console.log('🔔 Subscribing to viewing requests for email:', normalizedEmail);
    
    let unsubscribeMain: (() => void) | null = null;
    let unsubscribeFallback: (() => void) | null = null;
    
    // OPTIMIZATION: Try top-level agentEmail field first
    const q = query(
      collection(db, this.collectionName),
      where('agentEmail', '==', normalizedEmail),
      orderBy('createdAt', 'desc')
    );

    unsubscribeMain = onSnapshot(
      q,
      (querySnapshot) => {
        const requests: BookViewingRequest[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as BookViewingRequest;
          // Filter to ensure we only include matching requests
          if (data.agentEmail?.toLowerCase() === normalizedEmail || 
              data.property?.agent?.email?.toLowerCase() === normalizedEmail) {
            requests.push(data);
          }
        });
        console.log(`🔔 Subscription update: ${requests.length} requests for email: ${normalizedEmail}`);
        callback(requests);
      },
      (error) => {
        // Fallback to nested field query if top-level field query fails
        if (error.code === 'failed-precondition' || error.message?.includes('index')) {
          console.warn('⚠️ Top-level agentEmail field query failed, falling back to nested field query');
          const fallbackQ = query(
            collection(db, this.collectionName),
            where('property.agent.email', '==', normalizedEmail)
          );
          unsubscribeFallback = onSnapshot(
            fallbackQ,
            (querySnapshot) => {
              const requests: BookViewingRequest[] = [];
              querySnapshot.forEach((doc) => {
                const data = doc.data() as BookViewingRequest;
                if (data.property?.agent?.email?.toLowerCase() === normalizedEmail) {
                  requests.push(data);
                }
              });
              // Sort in memory since we can't use orderBy with nested field
              const sorted = requests.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
              console.log(`🔔 Subscription update (fallback): ${sorted.length} requests for email: ${normalizedEmail}`);
              callback(sorted);
            },
            (fallbackError) => {
              console.error('❌ Error in viewing requests by email subscription (fallback):', fallbackError);
              if (onError) {
                onError(fallbackError);
              }
            }
          );
        } else {
          console.error('❌ Error in viewing requests by email subscription:', error);
          console.error('❌ Subscription error details:', {
            code: error.code,
            message: error.message,
            collectionName: this.collectionName,
            email: normalizedEmail
          });
          if (onError) {
            onError(error);
          }
        }
      }
    );

    return () => {
      if (unsubscribeMain) unsubscribeMain();
      if (unsubscribeFallback) unsubscribeFallback();
    };
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

  async deleteRequestsForProperty(
    userId: string,
    property: { propertyId?: string | null; street?: string; town?: string }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.getUserRequests(userId);
      const requests = result.requests || [];
      const targetKey = property.propertyId || `${property.street || ''}-${property.town || ''}`;
      const matches = requests.filter((request) => {
        const requestKey = request.propertyId || `${request.property?.street || ''}-${request.property?.town || ''}`;
        return requestKey === targetKey;
      });

      await Promise.all(matches.map((request) => this.deleteRequest(request.id)));
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting matching viewing requests:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }
}

export const bookViewingRequestService = new BookViewingRequestService();
export default bookViewingRequestService;



