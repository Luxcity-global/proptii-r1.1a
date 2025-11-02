import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface LandlordRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  notes?: string;
  portfolio?: {
    totalProperties?: number;
    totalValue?: number;
    monthlyIncome?: number;
  };
  createdAt: Date;
}

class LandlordService {
  private landlordsCollection = collection(db, 'landlords');

  async createLandlord(landlord: Omit<LandlordRecord, 'id' | 'createdAt'>): Promise<string> {
    const payload: any = {
      ...landlord,
      createdAt: Timestamp.now(),
    };
    const ref = await addDoc(this.landlordsCollection, payload);
    return ref.id;
  }

  async getLandlords(): Promise<LandlordRecord[]> {
    try {
      const q = query(this.landlordsCollection, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => this.fromFirestore(d.id, d.data()));
    } catch {
      const snap = await getDocs(this.landlordsCollection);
      return snap.docs.map(d => this.fromFirestore(d.id, d.data()));
    }
  }

  async getLandlord(id: string): Promise<LandlordRecord | null> {
    const ref = doc(db, 'landlords', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return this.fromFirestore(snap.id, snap.data());
  }

  async updateLandlord(id: string, updates: Partial<LandlordRecord>): Promise<void> {
    const ref = doc(db, 'landlords', id);
    const payload: any = { ...updates };
    await updateDoc(ref, payload);
  }

  async deleteLandlord(id: string): Promise<void> {
    const ref = doc(db, 'landlords', id);
    await deleteDoc(ref);
  }

  private fromFirestore(id: string, data: any): LandlordRecord {
    return {
      id,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      company: data.company,
      address: data.address,
      notes: data.notes,
      portfolio: data.portfolio,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    };
  }
}

export const landlordService = new LandlordService();


