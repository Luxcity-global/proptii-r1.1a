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



