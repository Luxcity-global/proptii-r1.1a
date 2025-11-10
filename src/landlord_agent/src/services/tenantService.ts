import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Tenant } from '../App';

class TenantService {
  private tenantsCollection = collection(db, 'tenants');

  async createTenant(tenantData: Omit<Tenant, 'id'>, ownerUserId: string): Promise<string> {
    try {
    const payload: any = this.toFirestore({ ...tenantData, userId: ownerUserId });
    console.log('✅ TenantService: Creating tenant with userId:', ownerUserId);
      console.log('[tenantService] createTenant payload:', JSON.stringify(payload, null, 2));
      console.log('[tenantService] Firestore collection:', this.tenantsCollection.path);
      
    const ref = await addDoc(this.tenantsCollection, payload);
      console.log('✅ [tenantService] Successfully created tenant with id:', ref.id);
      console.log('✅ [tenantService] Document path:', ref.path);
      
      // Verify the document was created
      const verifyDoc = await getDoc(ref);
      if (verifyDoc.exists()) {
        console.log('✅ [tenantService] Verified tenant document exists in Firestore');
        console.log('✅ [tenantService] Document data:', verifyDoc.data());
      } else {
        console.error('❌ [tenantService] ERROR: Document was not created in Firestore!');
      }
      
    return ref.id;
    } catch (error) {
      console.error('❌ [tenantService] ERROR creating tenant:', error);
      console.error('❌ [tenantService] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
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
    // First, get the existing tenant to preserve userId
    const existing = await this.getTenant(id);
    const payload: any = this.toFirestore(updates, true);
    // Preserve userId if it exists on the existing tenant
    if (existing && (existing as any).userId) {
      payload.userId = (existing as any).userId;
      console.log('✅ TenantService: Preserving userId during update:', payload.userId);
    }
    await updateDoc(ref, payload);
  }

  async deleteTenant(id: string): Promise<void> {
    const ref = doc(db, 'tenants', id);
    await deleteDoc(ref);
  }

  private toFirestore(input: Partial<Tenant>, isPartial: boolean = false) {
    const out: any = { ...input };

    const removeUndefined = (value: any) => {
      if (Array.isArray(value)) {
        for (let i = value.length - 1; i >= 0; i--) {
          const element = value[i];
          if (element === undefined) {
            value.splice(i, 1);
          } else if (element && typeof element === 'object') {
            removeUndefined(element);
          }
        }
      } else if (value && typeof value === 'object') {
        Object.keys(value).forEach((key) => {
          const nested = value[key];
          if (nested === undefined) {
            delete value[key];
          } else if (nested && typeof nested === 'object') {
            removeUndefined(nested);
            if (!Array.isArray(nested) && Object.keys(nested).length === 0) {
              // Leave empty objects intact for Firestore merge semantics
            }
          }
        });
      }
    };

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
    if ('firstPaymentDate' in out && out.firstPaymentDate instanceof Date) {
      out.firstPaymentDate = Timestamp.fromDate(out.firstPaymentDate);
    }
    removeUndefined(out);
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
      paymentFrequency: data.paymentFrequency || 'monthly',
      firstPaymentDate: data.firstPaymentDate?.toDate ? data.firstPaymentDate.toDate() : (data.firstPaymentDate || undefined),
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
    // Preserve additional fields that aren't in Tenant type (steps 12-15)
    if (data.notes) (tenant as any).notes = data.notes;
    if (data.employer) (tenant as any).employer = data.employer;
    if (data.jobTitle) (tenant as any).jobTitle = data.jobTitle;
    if (data.annualIncome) (tenant as any).annualIncome = data.annualIncome;
    if (data.employmentType) (tenant as any).employmentType = data.employmentType;
    return tenant;
  }
}

export const tenantService = new TenantService();


