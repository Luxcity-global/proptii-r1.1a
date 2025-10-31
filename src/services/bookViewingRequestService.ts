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
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export interface BookViewingRequest {
  id: string;
  userId: string;
  propertyId: string;
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
    property: BookViewingRequest['property']
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
}

export const bookViewingRequestService = new BookViewingRequestService();
export default bookViewingRequestService;



