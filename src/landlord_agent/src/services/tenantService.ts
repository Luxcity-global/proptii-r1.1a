import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Tenant } from '../App';

class TenantService {
  private tenantsCollection = collection(db, 'tenants');

  async createTenant(tenantData: Omit<Tenant, 'id'>, ownerUserId: string): Promise<string> {
    const payload: any = this.toFirestore({ ...tenantData, userId: ownerUserId });
    console.log('✅ TenantService: Creating tenant with userId:', ownerUserId);
    console.log('[tenantService] createTenant payload:', payload);
    const ref = await addDoc(this.tenantsCollection, payload);
    console.log('[tenantService] created tenant with id:', ref.id);
    return ref.id;
  }

  async getTenants(ownerUserId?: string): Promise<Tenant[]> {
    try {
      if (ownerUserId) {
        console.log('🔍 TenantService: Filtering by userId:', ownerUserId);
      } else {
        console.warn('⚠️ TenantService: No userId filter provided - will load all tenants');
      }
      const base = query(this.tenantsCollection, orderBy('createdAt', 'desc'));
      const snap = await getDocs(base);
      let list = snap.docs.map(d => this.fromFirestore(d.id, d.data()));
      if (ownerUserId) {
        const beforeFilter = list.length;
        // Log each tenant's userId for debugging
        list.forEach(t => {
          const tUserId = (t as any).userId;
          console.log(`🔍 Tenant ${t.id} (${t.name}): userId=${tUserId || '❌ MISSING'}, matches filter: ${tUserId === ownerUserId ? '✅' : '❌'}`);
        });
        list = list.filter(t => {
          const tUserId = (t as any).userId;
          const matches = tUserId === ownerUserId;
          if (!matches && tUserId) {
            console.warn(`⚠️ Tenant ${t.id} (${t.name}) filtered out: userId "${tUserId}" !== "${ownerUserId}"`);
          }
          return matches;
        });
        console.log(`✅ TenantService: Filtered ${beforeFilter} tenants to ${list.length} for userId: ${ownerUserId}`);
      }
      console.log('[tenantService] getTenants (ordered) count:', list.length);
      return list;
    } catch {
      // Fallback without order if index missing
      console.warn('⚠️ TenantService: Firestore index missing, fetching without orderBy');
      const snap = await getDocs(this.tenantsCollection);
      let list = snap.docs.map(d => this.fromFirestore(d.id, d.data()));
      if (ownerUserId) {
        const beforeFilter = list.length;
        list = list.filter(t => (t as any).userId === ownerUserId);
        console.log(`✅ TenantService (fallback): Filtered ${beforeFilter} tenants to ${list.length} for userId: ${ownerUserId}`);
      }
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
    const tenant: Tenant & { userId?: string } = {
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
    // Preserve userId field for filtering (even though it's not in Tenant type)
    if (data.userId) {
      (tenant as any).userId = data.userId;
      console.log('📋 TenantService: Preserved userId for tenant:', id, 'userId:', data.userId);
    }
    return tenant;
  }
}

export const tenantService = new TenantService();


