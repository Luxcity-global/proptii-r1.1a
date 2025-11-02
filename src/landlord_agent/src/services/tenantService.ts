import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Tenant } from '../App';

class TenantService {
  private tenantsCollection = collection(db, 'tenants');

  async createTenant(tenantData: Omit<Tenant, 'id'>): Promise<string> {
    const payload: any = this.toFirestore(tenantData);
    console.log('[tenantService] createTenant payload:', payload);
    const ref = await addDoc(this.tenantsCollection, payload);
    console.log('[tenantService] created tenant with id:', ref.id);
    return ref.id;
  }

  async getTenants(): Promise<Tenant[]> {
    try {
      const q = query(this.tenantsCollection, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => this.fromFirestore(d.id, d.data()));
      console.log('[tenantService] getTenants (ordered) count:', list.length);
      return list;
    } catch {
      // Fallback without order if index missing
      const snap = await getDocs(this.tenantsCollection);
      const list = snap.docs.map(d => this.fromFirestore(d.id, d.data()));
      console.log('[tenantService] getTenants (no order) count:', list.length);
      return list;
    }
  }

  async getTenant(id: string): Promise<Tenant | null> {
    const ref = doc(db, 'tenants', id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return this.fromFirestore(snap.id, snap.data());
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<void> {
    const ref = doc(db, 'tenants', id);
    const payload: any = this.toFirestore(updates, true);
    await updateDoc(ref, payload);
  }

  async deleteTenant(id: string): Promise<void> {
    const ref = doc(db, 'tenants', id);
    await deleteDoc(ref);
  }

  private toFirestore(input: Partial<Tenant>, isPartial: boolean = false) {
    const out: any = { ...input };
    if (!isPartial) {
      out.createdAt = Timestamp.now();
    }
    if ('leaseStart' in out && out.leaseStart instanceof Date) {
      out.leaseStart = Timestamp.fromDate(out.leaseStart);
    }
    if ('leaseEnd' in out && out.leaseEnd instanceof Date) {
      out.leaseEnd = Timestamp.fromDate(out.leaseEnd);
    }
    if ('lastPaymentDate' in out && out.lastPaymentDate instanceof Date) {
      out.lastPaymentDate = Timestamp.fromDate(out.lastPaymentDate);
    }
    return out;
  }

  private fromFirestore(id: string, data: any): Tenant {
    return {
      id,
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      propertyAddress: data.propertyAddress || '',
      propertyId: data.propertyId || '',
      rentAmount: data.rentAmount || 0,
      leaseStart: data.leaseStart?.toDate ? data.leaseStart.toDate() : (data.leaseStart || new Date()),
      leaseEnd: data.leaseEnd?.toDate ? data.leaseEnd.toDate() : (data.leaseEnd || new Date()),
      status: data.status || 'active',
      referencingStatus: data.referencingStatus || 'not-started',
      paymentStatus: data.paymentStatus || 'current',
      avatar: data.avatar,
      emergencyContact: data.emergencyContact,
      defaultRiskScore: data.defaultRiskScore,
      lastPaymentDate: data.lastPaymentDate?.toDate ? data.lastPaymentDate.toDate() : data.lastPaymentDate,
      overdueAmount: data.overdueAmount,
    };
  }
}

export const tenantService = new TenantService();


