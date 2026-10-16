import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { dedupeTenants } from '../utils/dedupeTenants';

function withTimeout<T>(promise: Promise<T>, timeoutMs = 15000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore operation timed out')), timeoutMs),
    ),
  ]);
}

function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(cleanUndefined);
  if (typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof admin.firestore.FieldValue)) {
    const res: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        res[key] = cleanUndefined(value);
      }
    }
    return res;
  }
  return obj;
}

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  private get db() {
    if (!admin.apps.length) return null;
    try {
      return admin.firestore();
    } catch {
      return null;
    }
  }

  private get collection() {
    const db = this.db;
    return db ? db.collection('tenants') : null;
  }

  private get paymentsCol() {
    const db = this.db;
    return db ? db.collection('rent_payments') : null;
  }

  async createTenant(tenantData: any, userId?: string) {
    const col = this.collection;
    const docId = tenantData.id || `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const effectiveUserId = userId || tenantData.userId || 'unknown';

    const rawPayload = {
      ...tenantData,
      id: docId,
      userId: effectiveUserId,
      status: tenantData.status || 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const payload = cleanUndefined(rawPayload);

    if (col) {
      try {
        await withTimeout(col.doc(docId).set(payload));
        this.logger.log(`Created tenant ${docId} for user ${effectiveUserId}`);

        // Link to property if propertyId is provided
        if (payload.propertyId && this.db) {
          try {
            await this.db.collection('properties').doc(payload.propertyId).update({
              status: 'occupied',
              tenantId: docId,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            this.logger.log(`Linked property ${payload.propertyId} to tenant ${docId} with status occupied`);
          } catch (propErr: any) {
            this.logger.warn(`Failed to update property status to occupied: ${propErr?.message || propErr}`);
          }
        }
      } catch (err: any) {
        this.logger.error(`createTenant Firestore error: ${err?.message || err}`, err?.stack);
        throw err;
      }
    }

    return {
      success: true,
      id: docId,
      tenant: {
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  async getTenants(userId?: string, ownedPropertyIds?: string[], userEmail?: string, extraUserId?: string) {
    const col = this.collection;
    if (!col) return { success: true, tenants: [] };

    try {
      const docMap = new Map<string, any>();

      // 1. Query by userId (UID from JWT)
      if (userId) {
        try {
          const snap1 = await withTimeout(col.where('userId', '==', userId).get(), 15000);
          snap1.docs.forEach((doc) => docMap.set(doc.id, { ...doc.data(), id: doc.id }));
        } catch (e: any) {
          this.logger.warn(`getTenants by userId error: ${e?.message}`);
        }
      }

      // 2. Query by userEmail if provided and different from userId
      //    (catches tenants stored with email as userId)
      const email = userEmail?.toLowerCase()?.trim();
      if (email && email !== userId) {
        try {
          const snap2 = await withTimeout(col.where('userId', '==', email).get(), 15000);
          snap2.docs.forEach((doc) => docMap.set(doc.id, { ...doc.data(), id: doc.id }));
        } catch (e: any) {
          this.logger.warn(`getTenants by email error: ${e?.message}`);
        }
      }

      // 3. Query by extraUserId from query param (e.g. email string passed explicitly by frontend)
      if (extraUserId && extraUserId !== userId && extraUserId !== email) {
        try {
          const snap4 = await withTimeout(col.where('userId', '==', extraUserId).get(), 15000);
          snap4.docs.forEach((doc) => docMap.set(doc.id, { ...doc.data(), id: doc.id }));
        } catch (e: any) {
          this.logger.warn(`getTenants by extraUserId error: ${e?.message}`);
        }
      }

      // 4. Query by ownedPropertyIds
      if (ownedPropertyIds && ownedPropertyIds.length > 0) {
        // Firestore "in" queries support up to 30 elements per batch
        for (let i = 0; i < ownedPropertyIds.length; i += 30) {
          const batch = ownedPropertyIds.slice(i, i + 30);
          try {
            const snap3 = await withTimeout(col.where('propertyId', 'in', batch).get(), 15000);
            snap3.docs.forEach((doc) => docMap.set(doc.id, { ...doc.data(), id: doc.id }));
          } catch (e: any) {
            this.logger.warn(`getTenants by propertyId batch error: ${e?.message}`);
          }
        }
      }

      const tenants = dedupeTenants(Array.from(docMap.values()).map((data) => ({
        ...data,
        id: data.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt,
        leaseStart: data.leaseStart?.toDate?.()?.toISOString?.() || data.leaseStart,
        leaseEnd: data.leaseEnd?.toDate?.()?.toISOString?.() || data.leaseEnd,
        firstPaymentDate: data.firstPaymentDate?.toDate?.()?.toISOString?.() || data.firstPaymentDate,
        lastPaymentDate: data.lastPaymentDate?.toDate?.()?.toISOString?.() || data.lastPaymentDate,
      })));

      return { success: true, tenants };
    } catch (err: any) {
      this.logger.warn(`getTenants error: ${err?.message || err}`);
      return { success: true, tenants: [] };
    }
  }

  async getTenant(id: string) {
    const col = this.collection;
    if (!col) return { success: false, tenant: null };

    try {
      const doc = await withTimeout(col.doc(id).get());
      if (!doc.exists) {
        return { success: false, tenant: null };
      }
      const data = doc.data() || {};
      return {
        success: true,
        tenant: {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt,
          leaseStart: data.leaseStart?.toDate?.()?.toISOString?.() || data.leaseStart,
          leaseEnd: data.leaseEnd?.toDate?.()?.toISOString?.() || data.leaseEnd,
          firstPaymentDate: data.firstPaymentDate?.toDate?.()?.toISOString?.() || data.firstPaymentDate,
          lastPaymentDate: data.lastPaymentDate?.toDate?.()?.toISOString?.() || data.lastPaymentDate,
        },
      };
    } catch (err: any) {
      this.logger.warn(`getTenant error: ${err?.message || err}`);
      return { success: false, tenant: null };
    }
  }

  async updateTenant(id: string, updates: any) {
    const col = this.collection;
    if (!col) return { success: true };

    try {
      await withTimeout(
        col.doc(id).set(
          {
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        ),
      );
      return { success: true };
    } catch (err: any) {
      this.logger.warn(`updateTenant error: ${err?.message || err}`);
      return { success: false, error: err?.message };
    }
  }

  async deleteTenant(id: string) {
    const col = this.collection;
    if (!col) return { success: true };

    try {
      // 1. Fetch tenant doc first to extract propertyId and email
      let propertyId: string | undefined;
      let tenantEmail: string | undefined;
      let propertyAddress: string | undefined;
      try {
        const snap = await withTimeout(col.doc(id).get());
        if (snap && snap.exists) {
          const data = snap.data();
          propertyId = data?.propertyId;
          tenantEmail = data?.email;
          propertyAddress = data?.propertyAddress;
        }
      } catch (err: any) {
        this.logger.warn(`Could not fetch tenant before delete: ${err?.message || err}`);
      }

      // 2. Delete the tenant document
      await withTimeout(col.doc(id).delete());

      // 3. Clear property attachment and mark vacant in Firestore
      const db = this.db;
      if (db) {
        try {
          if (propertyId) {
            try {
              await db.collection('properties').doc(propertyId).set(
                {
                  status: 'vacant',
                  tenantId: admin.firestore.FieldValue.delete(),
                  tenant: admin.firestore.FieldValue.delete(),
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                { merge: true },
              );
              this.logger.log(`Vacated property ${propertyId} linked to deleted tenant ${id}`);
            } catch (pErr: any) {
              this.logger.warn(`Failed to vacate property ${propertyId}: ${pErr?.message || pErr}`);
            }
          }

          // Also query properties where tenantId == id
          try {
            const propSnap = await db.collection('properties').where('tenantId', '==', id).get();
            for (const doc of propSnap.docs) {
              if (doc.id !== propertyId) {
                await doc.ref.set(
                  {
                    status: 'vacant',
                    tenantId: admin.firestore.FieldValue.delete(),
                    tenant: admin.firestore.FieldValue.delete(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                  },
                  { merge: true },
                );
                this.logger.log(`Vacated matching property ${doc.id} for deleted tenant ${id}`);
              }
            }
          } catch (propSnapErr: any) {
            this.logger.warn(`Failed to query properties by tenantId: ${propSnapErr?.message || propSnapErr}`);
          }

          // Also query properties matching propertyAddress
          if (propertyAddress) {
            try {
              const addrSnap = await db.collection('properties').where('address', '==', propertyAddress).get();
              for (const doc of addrSnap.docs) {
                if (doc.id !== propertyId) {
                  await doc.ref.set(
                    {
                      status: 'vacant',
                      tenantId: admin.firestore.FieldValue.delete(),
                      tenant: admin.firestore.FieldValue.delete(),
                      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    },
                    { merge: true },
                  );
                  this.logger.log(`Vacated matching property by address ${doc.id} for deleted tenant ${id}`);
                }
              }
            } catch (addrErr: any) {
              this.logger.warn(`Failed to query properties by address: ${addrErr?.message || addrErr}`);
            }
          }
        } catch (propErr: any) {
          this.logger.warn(`Failed to clean up properties on tenant delete: ${propErr?.message || propErr}`);
        }

        // 4. Clean up referencing_requests for this tenant email
        if (tenantEmail) {
          try {
            const normalizedEmail = tenantEmail.toLowerCase().trim();
            const refSnap = await db.collection('referencing_requests').where('tenantEmail', '==', normalizedEmail).get();
            for (const doc of refSnap.docs) {
              await doc.ref.delete();
            }
            if (refSnap.size > 0) {
              this.logger.log(`Deleted ${refSnap.size} referencing_requests for ${normalizedEmail}`);
            }
          } catch (refErr: any) {
            this.logger.warn(`Failed to clean up referencing_requests on tenant delete: ${refErr?.message || refErr}`);
          }
        }
      }

      return { success: true };
    } catch (err: any) {
      this.logger.warn(`deleteTenant error: ${err?.message || err}`);
      return { success: false, error: err?.message };
    }
  }

  // ── Payment Schedules ──────────────────────────────────────────────────────
  async saveBulkPayments(writes: any[]) {
    const col = this.paymentsCol;
    if (!col || !writes || writes.length === 0) return { success: true, count: 0 };

    try {
      const db = this.db!;
      const batch = db.batch();
      for (const w of writes) {
        const docId = w.id || `${w.tenantId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
        const docRef = col.doc(docId);
        batch.set(docRef, {
          ...w,
          id: docId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
      await withTimeout(batch.commit());
      return { success: true, count: writes.length };
    } catch (err: any) {
      this.logger.warn(`saveBulkPayments error: ${err?.message || err}`);
      return { success: false, error: err?.message };
    }
  }

  async getTenantPayments(tenantId: string) {
    const col = this.paymentsCol;
    if (!col) return { success: true, payments: [] };

    try {
      const snapshot = await withTimeout(col.where('tenantId', '==', tenantId).get());
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { success: true, payments };
    } catch (err: any) {
      this.logger.warn(`getTenantPayments error: ${err?.message || err}`);
      return { success: true, payments: [] };
    }
  }

  async getPaymentPeriod(periodId: string) {
    const col = this.paymentsCol;
    if (!col) return null;

    try {
      const snap = await withTimeout(col.doc(periodId).get());
      if (!snap.exists) return null;
      return { id: snap.id, ...snap.data() };
    } catch (err: any) {
      this.logger.warn(`getPaymentPeriod error: ${err?.message || err}`);
      return null;
    }
  }

  async updatePaymentStatus(periodId: string, status: string, notes?: string) {
    const col = this.paymentsCol;
    if (!col) return { success: true };

    try {
      const payload: any = {
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (notes !== undefined) payload.notes = notes;
      if (status === 'paid') payload.paidAt = new Date().toISOString();

      await withTimeout(col.doc(periodId).set(payload, { merge: true }));
      return { success: true };
    } catch (err: any) {
      this.logger.warn(`updatePaymentStatus error: ${err?.message || err}`);
      return { success: false, error: err?.message };
    }
  }
}
