import { Injectable, NotFoundException, InternalServerErrorException, Optional } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { UprnMatchService } from '../gov-data/services/uprn-match.service';
import { getRedisClient } from '../utils/redis-client';

function isPropertyAuthorized(existing: any, userId?: string, userEmail?: string): boolean {
  if (!existing) return false;

  const uid = (userId || '').trim();
  const email = (userEmail || '').trim().toLowerCase();

  // 1. Direct UID matching across UID-like fields
  if (uid) {
    if (existing.userId && String(existing.userId).trim() === uid) return true;
    if (existing.landlordId && String(existing.landlordId).trim() === uid) return true;
    if (existing.ownerId && String(existing.ownerId).trim() === uid) return true;
  }

  // 2. Direct Email matching across all potential email/user fields
  if (email) {
    const candidateEmails = [
      existing.ownerEmail,
      existing.landlordEmail,
      existing.email,
      existing.userEmail,
      existing.userId,     // often saved as email
      existing.landlordId, // often saved as email
    ]
      .filter(Boolean)
      .map(e => String(e).trim().toLowerCase());

    if (candidateEmails.includes(email)) return true;
  }

  // 3. Reverse UID match if UID passed is an email
  if (uid && uid.includes('@')) {
    const uidEmail = uid.toLowerCase();
    const candidateEmails = [
      existing.ownerEmail,
      existing.landlordEmail,
      existing.email,
      existing.userEmail,
      existing.userId,
      existing.landlordId,
    ]
      .filter(Boolean)
      .map(e => String(e).trim().toLowerCase());

    if (candidateEmails.includes(uidEmail)) return true;
  }

  return false;
}

export function checkSpecificationAnomaly(bedrooms?: any, bathrooms?: any): string | null {
  const beds = parseInt(bedrooms, 10);
  const baths = parseInt(bathrooms, 10);
  if (isNaN(beds) || isNaN(baths)) return null;
  if (beds === 0 && baths > 1) {
    return 'Studio property configured with multiple bathrooms';
  }
  if (beds === 1 && baths >= 3) {
    return '1-bedroom property configured with 3 or more bathrooms';
  }
  if (beds >= 2 && baths > beds + 2) {
    return `Bathroom count (${baths}) unusually exceeds bedroom count (${beds})`;
  }
  return null;
}

export interface PaginatedSearchOptions {
  query?: string;
  limit?: number;
  status?: string;
  cursor?: string;
}

@Injectable()
export class NativePropertiesService {
  constructor(
    @Optional() private readonly uprnMatchService?: UprnMatchService,
  ) {}

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
    return db ? db.collection('properties') : null;
  }

  /**
   * Updates portfolio_summary document for the landlord with FieldValue.increment()
   * Pre-aggregates property count and total monthly rent (Task p4-9)
   */
  private async updateLandlordPortfolioSummary(
    landlordId: string,
    deltas: { properties?: number; monthlyRent?: number; occupied?: number },
  ) {
    const db = this.db;
    if (!db || !landlordId) return;

    try {
      const summaryRef = db.collection('portfolio_summary').doc(landlordId);
      const updatePayload: Record<string, any> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (deltas.properties !== undefined) {
        updatePayload.totalProperties = admin.firestore.FieldValue.increment(deltas.properties);
      }
      if (deltas.monthlyRent !== undefined) {
        updatePayload.monthlyRent = admin.firestore.FieldValue.increment(deltas.monthlyRent);
      }
      if (deltas.occupied !== undefined) {
        updatePayload.occupiedProperties = admin.firestore.FieldValue.increment(deltas.occupied);
      }

      await summaryRef.set(updatePayload, { merge: true });

      // Invalidate Redis portfolio summary cache
      const redis = getRedisClient();
      if (redis) {
        await redis.del(`insights:portfolio:${landlordId}`);
      }
    } catch (err: any) {
      console.warn(`[NativePropertiesService] portfolio_summary pre-aggregation error: ${err?.message || err}`);
    }
  }

  /**
   * Indexed property search with cursor pagination (Task p4-5)
   */
  async searchPublicPaginated(options: PaginatedSearchOptions) {
    const col = this.collection;
    if (!col) return { results: [], nextCursor: null, total: 0 };

    const limitNum = Math.min(Math.max(options.limit || 50, 1), 200);

    try {
      let queryRef: admin.firestore.Query = col;

      if (options.status) {
        queryRef = queryRef.where('status', '==', options.status);
      }

      // Order by createdAt descending for deterministic cursor pagination
      queryRef = queryRef.orderBy('createdAt', 'desc');

      if (options.cursor) {
        const cursorDoc = await col.doc(options.cursor).get();
        if (cursorDoc.exists) {
          queryRef = queryRef.startAfter(cursorDoc);
        }
      }

      queryRef = queryRef.limit(limitNum + 1);

      const snapshot = await queryRef.get();
      let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      let nextCursor: string | null = null;
      if (docs.length > limitNum) {
        const lastItem = docs[limitNum - 1];
        nextCursor = lastItem.id;
        docs = docs.slice(0, limitNum);
      }

      if (options.query) {
        const q = options.query.toLowerCase().trim();
        docs = docs.filter((d: any) =>
          (d.title && d.title.toLowerCase().includes(q)) ||
          (d.address && d.address.toLowerCase().includes(q)) ||
          (d.city && d.city.toLowerCase().includes(q)) ||
          (d.postcode && d.postcode.toLowerCase().includes(q))
        );
      }

      return { results: docs, nextCursor, total: docs.length };
    } catch (err: any) {
      console.warn('[NativePropertiesService] Firestore searchPublicPaginated fallback:', err?.message || err);
      // Fallback to basic query if composite index is pending
      const fallbackSnapshot = await col.limit(limitNum).get();
      let fallbackDocs = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { results: fallbackDocs, nextCursor: null, total: fallbackDocs.length };
    }
  }

  async searchPublic(query = '', limit = 50) {
    const res = await this.searchPublicPaginated({ query, limit });
    return res.results;
  }

  async findAllByUser(userId?: string, email?: string) {
    const col = this.collection;
    if (!col) return [];

    try {
      const docMap = new Map<string, any>();

      if (userId) {
        const [s1, s2] = await Promise.all([
          col.where('userId', '==', userId).get().catch(() => ({ docs: [] })),
          col.where('landlordId', '==', userId).get().catch(() => ({ docs: [] })),
        ]);
        s1.docs.forEach((doc: any) => docMap.set(doc.id, { id: doc.id, ...doc.data() }));
        s2.docs.forEach((doc: any) => docMap.set(doc.id, { id: doc.id, ...doc.data() }));
      }

      if (email) {
        const mail = email.toLowerCase().trim();
        const [s3, s4, s5, s6, s7] = await Promise.all([
          col.where('ownerEmail', '==', mail).get().catch(() => ({ docs: [] })),
          col.where('landlordEmail', '==', mail).get().catch(() => ({ docs: [] })),
          col.where('email', '==', mail).get().catch(() => ({ docs: [] })),
          col.where('userId', '==', mail).get().catch(() => ({ docs: [] })),
          col.where('landlordId', '==', mail).get().catch(() => ({ docs: [] })),
        ]);
        s3.docs.forEach((doc: any) => docMap.set(doc.id, { id: doc.id, ...doc.data() }));
        s4.docs.forEach((doc: any) => docMap.set(doc.id, { id: doc.id, ...doc.data() }));
        s5.docs.forEach((doc: any) => docMap.set(doc.id, { id: doc.id, ...doc.data() }));
        s6.docs.forEach((doc: any) => docMap.set(doc.id, { id: doc.id, ...doc.data() }));
        s7.docs.forEach((doc: any) => docMap.set(doc.id, { id: doc.id, ...doc.data() }));
      }

      return Array.from(docMap.values());
    } catch (err: any) {
      console.warn('[NativePropertiesService] Firestore findAllByUser error:', err?.message || err);
      return [];
    }
  }

  async findById(id: string) {
    const col = this.collection;
    if (!col) return null;

    try {
      const doc = await col.doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (err: any) {
      console.warn('[NativePropertiesService] Firestore findById error:', err?.message || err);
      return null;
    }
  }

  async create(data: any) {
    const col = this.collection;
    if (!col) {
      throw new InternalServerErrorException('Firestore database connection is unavailable. Property could not be saved to DB.');
    }

    try {
      const docRef = col.doc();
      const specWarning = checkSpecificationAnomaly(data?.bedrooms, data?.bathrooms ?? data?.bathroom_count);
      if (specWarning) {
        console.warn(`[NativePropertiesService] Property specification anomaly: ${specWarning}`);
      }

      // ── Task p4-8: Store resolved UPRN on property document at creation ──────
      let resolvedUprn = data?.uprn || null;
      if (!resolvedUprn && this.uprnMatchService && data?.postcode) {
        try {
          const matchResult = await this.uprnMatchService.match({
            paon: data?.address || '',
            saon: '',
            street: data?.address || '',
            postcode: data?.postcode || '',
          });
          if (matchResult && matchResult.uprn) {
            resolvedUprn = matchResult.uprn;
            console.log(`[NativePropertiesService] Resolved UPRN ${resolvedUprn} for address "${data?.address}, ${data?.postcode}"`);
          }
        } catch (uprnErr: any) {
          console.warn(`[NativePropertiesService] UPRN resolution non-fatal warning: ${uprnErr?.message}`);
        }
      }

      const rentAmount = Number(data?.rentAmount || data?.price || 0);

      const propertyData = {
        ...data,
        id: docRef.id,
        uprn: resolvedUprn,
        price: rentAmount || data?.price,
        rentAmount: rentAmount || data?.price,
        specificationWarning: specWarning || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await docRef.set(propertyData);
      console.log(`[NativePropertiesService] Successfully saved property ${docRef.id} to Firestore.`);

      // ── Task p4-9: Pre-aggregate landlord financials with FieldValue.increment() ──
      const landlordId = data.landlordId || data.userId;
      if (landlordId) {
        await this.updateLandlordPortfolioSummary(landlordId, {
          properties: 1,
          monthlyRent: rentAmount > 0 ? rentAmount : 0,
        });
      }

      return propertyData;
    } catch (err: any) {
      console.error('[NativePropertiesService] Failed to save property to Firestore:', err);
      throw new InternalServerErrorException(`Failed to save property to database: ${err?.message || err}`);
    }
  }

  async update(id: string, userId: string, userEmail: string, data: any) {
    const col = this.collection;
    if (!col) {
      throw new InternalServerErrorException('Firestore database connection is unavailable.');
    }

    const docRef = col.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException('Property not found');
    }

    const existing = doc.data();
    if (!isPropertyAuthorized(existing, userId, userEmail)) {
      throw new NotFoundException('Property not found or unauthorized');
    }

    // Clean undefined values to prevent Firestore driver errors
    const cleanedData = JSON.parse(JSON.stringify(data, (key, value) => value === undefined ? null : value));

    const mergedBeds = cleanedData.bedrooms !== undefined ? cleanedData.bedrooms : existing?.bedrooms;
    const mergedBaths = cleanedData.bathrooms !== undefined ? cleanedData.bathrooms : (cleanedData.bathroom_count !== undefined ? cleanedData.bathroom_count : (existing?.bathrooms ?? existing?.bathroom_count));
    const specWarning = checkSpecificationAnomaly(mergedBeds, mergedBaths);
    if (specWarning) {
      console.warn(`[NativePropertiesService] Property update specification anomaly: ${specWarning}`);
    }

    const updatedData = {
      ...cleanedData,
      specificationWarning: specWarning || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (cleanedData.status === 'vacant' || cleanedData.tenantId === null) {
      updatedData.status = cleanedData.status || 'vacant';
      updatedData.tenantId = null;
      updatedData.tenant = null;
    }

    // Adjust rent delta if price changed
    const oldRent = Number(existing?.price || existing?.rentAmount || 0);
    const newRent = Number(cleanedData?.price || cleanedData?.rentAmount || oldRent);
    const rentDiff = newRent - oldRent;

    await docRef.update(updatedData);

    const landlordId = existing?.landlordId || existing?.userId || userId;
    if (landlordId && rentDiff !== 0) {
      await this.updateLandlordPortfolioSummary(landlordId, {
        monthlyRent: rentDiff,
      });
    }

    return { id, ...existing, ...updatedData };
  }

  async remove(id: string, userId: string, userEmail: string) {
    const col = this.collection;
    if (!col) {
      throw new InternalServerErrorException('Firestore database connection is unavailable.');
    }

    const docRef = col.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new NotFoundException('Property not found');
    }

    const existing = doc.data();
    if (!isPropertyAuthorized(existing, userId, userEmail)) {
      throw new NotFoundException('Property not found or unauthorized');
    }

    const rentAmount = Number(existing?.price || existing?.rentAmount || 0);
    const landlordId = existing?.landlordId || existing?.userId || userId;

    await docRef.delete();

    // ── Task p4-9: Decrement portfolio summary on property deletion ──────────
    if (landlordId) {
      await this.updateLandlordPortfolioSummary(landlordId, {
        properties: -1,
        monthlyRent: rentAmount > 0 ? -rentAmount : 0,
      });
    }

    // If documents were assigned to this property in landlord_documents, unassign them
    try {
      const db = this.db;
      if (db) {
        const snap = await db.collection('landlord_documents').where('propertyId', '==', id).get();
        if (!snap.empty) {
          const batch = db.batch();
          snap.docs.forEach(d => {
            batch.update(d.ref, { propertyId: null, updatedAt: new Date().toISOString() });
          });
          await batch.commit();
        }
      }
    } catch {}

    return { success: true };
  }
}
