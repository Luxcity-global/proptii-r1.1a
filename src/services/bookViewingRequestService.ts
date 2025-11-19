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

export interface BookViewingRequest {
  id: string;
  userId: string;
  propertyId: string;
  landlordId?: string | null;
  agentId?: string | null;
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
    const q = query(
      collection(db, this.collectionName),
      where(field, '==', managerId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const out: BookViewingRequest[] = [];
    snap.forEach(d => out.push(d.data() as BookViewingRequest));
    return out;
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

  async getManagerRequests(managerId: string): Promise<{ success: boolean; requests?: BookViewingRequest[]; error?: string }> {
    try {
      const landlordRequests = await this.getRequestsByManagerField('landlordId', managerId);
      const agentRequests = await this.getRequestsByManagerField('agentId', managerId);
      const requests = this.mergeRequestsById(landlordRequests, agentRequests);
      return { success: true, requests };
    } catch (error: any) {
      console.error('Error getting manager viewing requests:', error);
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
      const q = query(
        collection(db, this.collectionName),
        where('property.agent.email', '==', normalizedEmail),
        orderBy('createdAt', 'desc')
      );
      
      console.log('🔍 About to execute Firestore query...');
      console.log('🔍 Query details:', {
        collection: this.collectionName,
        filter: 'property.agent.email == ' + normalizedEmail,
        orderBy: 'createdAt desc'
      });
      
      const querySnapshot = await getDocs(q);
      console.log('🔍 Query completed! Snapshot size:', querySnapshot.size);
      console.log('🔍 Query empty?', querySnapshot.empty);
      
      const requests: BookViewingRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as BookViewingRequest;
        requests.push(data);
        console.log('📋 Found request:', {
          id: data.id,
          agentEmail: data.property?.agent?.email,
          propertyStreet: data.property?.street
        });
      });
      
      console.log(`✅✅✅ Retrieved ${requests.length} requests for email: ${normalizedEmail} ✅✅✅`);
      return { success: true, requests };
    } catch (error: any) {
      // Fallback without orderBy if index is missing
      if (error.code === 'failed-precondition' && error.message?.includes('index')) {
        console.warn('⚠️ Firestore index missing, falling back to query without orderBy');
        const normalizedEmail = agentEmail?.toLowerCase().trim();
        const fallbackQuery = query(
          collection(db, this.collectionName),
          where('property.agent.email', '==', normalizedEmail)
        );
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const requests: BookViewingRequest[] = [];
        fallbackSnapshot.forEach((doc) => {
          const data = doc.data() as BookViewingRequest;
          requests.push(data);
          console.log('📋 Found request (fallback):', {
            id: data.id,
            agentEmail: data.property?.agent?.email,
            propertyStreet: data.property?.street
          });
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
    const q = query(
      collection(db, this.collectionName),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snap) => {
        const out: BookViewingRequest[] = [];
        snap.forEach(d => out.push(d.data() as BookViewingRequest));
        callback(out);
      },
      (err) => {
        console.error('Error in requests subscription:', err);
        if (onError) onError(err as any);
      }
    );
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
    const q = query(
      collection(db, this.collectionName),
      where('property.agent.email', '==', normalizedEmail),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const requests: BookViewingRequest[] = [];
        querySnapshot.forEach((doc) => {
          requests.push(doc.data() as BookViewingRequest);
        });
        console.log(`🔔 Subscription update: ${requests.length} requests for email: ${normalizedEmail}`);
        callback(requests);
      },
      (error) => {
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
    );
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



