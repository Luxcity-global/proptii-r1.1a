import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as admin from 'firebase-admin';

const VIEWING_STATUSES = new Set([
  'requested',
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'rescheduled',
]);

@Injectable()
export class ViewingRequestService {
  private get db(): admin.firestore.Firestore | null {
    if (!admin.apps.length) return null;
    try { return admin.firestore(); } catch { return null; }
  }

  private get collection() {
    const db = this.db;
    return db ? db.collection('viewings') : null;
  }

  private canonicalStatus(value: unknown, fallback = 'pending'): string {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return fallback;
    if (raw === 'canceled') return 'cancelled';
    if (raw === 'request') return 'requested';
    return VIEWING_STATUSES.has(raw) ? raw : fallback;
  }

  private normalizedEmail(...values: unknown[]): string {
    for (const value of values) {
      if (typeof value !== 'string') continue;
      const email = value.trim().toLowerCase();
      if (email.includes('@')) return email;
    }
    return '';
  }

  private emailCandidates(email: string): string[] {
    const raw = (email || '').trim();
    const lower = raw.toLowerCase();
    return [...new Set([lower, raw].filter((value) => value.includes('@')))];
  }

  private async collectEmails(email: string, userId?: string): Promise<Set<string>> {
    const emails = new Set<string>(this.emailCandidates(email));
    const db = this.db;
    if (!db || !userId) return emails;

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const profileEmail = this.normalizedEmail(userDoc.exists ? (userDoc.data() as any)?.email : '');
      if (profileEmail) emails.add(profileEmail);
    } catch { /* profile lookup is optional */ }

    try {
      if (admin.apps.length) {
        const record = await admin.auth().getUser(userId);
        const authEmail = this.normalizedEmail(
          record.email,
          record.providerData?.map((provider) => provider.email).find(Boolean),
        );
        if (authEmail) emails.add(authEmail);
      }
    } catch { /* mock users have no auth record */ }

    return emails;
  }

  /** Older rows stored only requestedDate/propertyTitle. Both UIs read property and viewingDetails. */
  private presentViewing(id: string, data: any) {
    const source = data || {};
    const storedProperty = source.property && typeof source.property === 'object' ? source.property : null;
    const property = {
      street: storedProperty?.street || source.propertyTitle || 'Property viewing',
      town: storedProperty?.town || '',
      city: storedProperty?.city || '',
      postcode: storedProperty?.postcode || '',
      agent: {
        id: storedProperty?.agent?.id || source.agentId || '',
        name: storedProperty?.agent?.name || '',
        email: storedProperty?.agent?.email || source.agentEmail || '',
        phone: storedProperty?.agent?.phone || '',
        company: storedProperty?.agent?.company || '',
      },
    };

    const details = source.viewingDetails && typeof source.viewingDetails === 'object' ? source.viewingDetails : {};
    const userDetails = details.userDetails || {};
    const viewingDetails: any = {
      date: details.date || source.requestedDate || '',
      time: details.time || source.requestedTime || '',
      preference: details.preference || 'In-Person Viewing',
      userDetails: {
        fullName: userDetails.fullName || '',
        email: userDetails.email || source.tenantEmail || '',
        phoneNumber: userDetails.phoneNumber || '',
      },
    };
    if (details.whatsappNumber) viewingDetails.whatsappNumber = details.whatsappNumber;

    return {
      ...source,
      id: source.id || id,
      userId: source.userId || source.tenantId || '',
      property,
      viewingDetails,
      status: this.canonicalStatus(source.status),
    };
  }

  async createViewing(callerId: string, callerEmailRaw: string, data: any) {
    const col = this.collection;
    const callerEmail = this.normalizedEmail(callerEmailRaw);
    const legacyDetails = data?.viewing_date || data?.viewing_time || data?.preference
      ? {
          date: data.viewing_date || '',
          time: data.viewing_time || '',
          preference: data.preference || 'In-Person Viewing',
          userDetails: data.userDetails || { fullName: '', email: callerEmail, phoneNumber: '' },
          ...(data.whatsappNumber ? { whatsappNumber: data.whatsappNumber } : {}),
        }
      : null;
    const details = data?.viewingDetails && typeof data.viewingDetails === 'object'
      ? data.viewingDetails
      : legacyDetails;
    const rawProperty = data?.property && typeof data.property === 'object' ? data.property : null;
    const legacyAgent = data?.agent && typeof data.agent === 'object' ? data.agent : null;
    const property = rawProperty ? { ...rawProperty } : null;
    if (property && !property.agent && legacyAgent) {
      property.agent = {
        id: legacyAgent.id || '',
        name: legacyAgent.name || '',
        email: legacyAgent.email || '',
        phone: legacyAgent.phone || '',
        company: legacyAgent.company || '',
      };
    }
    if (property && property.agent === undefined) delete property.agent;
    const contactEmail = this.normalizedEmail(details?.userDetails?.email, data?.tenantEmail);
    const agentEmail = this.normalizedEmail(data?.agentEmail, property?.agent?.email, legacyAgent?.email);
    const explicitManager = Boolean(data?.landlordId || data?.agentId || agentEmail);
    const callerIsManager = Boolean(
      contactEmail && callerEmail && contactEmail !== callerEmail && explicitManager,
    );

    const tenantEmail = callerIsManager ? contactEmail : (callerEmail || contactEmail);
    const callerMatchesAgent = Boolean(agentEmail && callerEmail && agentEmail === callerEmail);
    const resolvedManagerId = data?.landlordId || data?.agentId || await this.managerIdForEmail(agentEmail);
    const landlordId = resolvedManagerId || (callerIsManager || callerMatchesAgent ? callerId : '') || '';
    const agentId = data?.agentId || property?.agent?.id || resolvedManagerId || '';
    const landlordEmail = callerIsManager || callerMatchesAgent
      ? callerEmail
      : this.normalizedEmail(data?.landlordEmail, agentEmail);
    const requestedDate = data?.requestedDate || details?.date || '';
    const requestedTime = data?.requestedTime || details?.time || '';
    const rawStatus = typeof data?.status === 'string' ? data.status.toLowerCase() : '';
    const status = VIEWING_STATUSES.has(rawStatus) ? rawStatus : 'pending';
    const propertyTitle = data?.propertyTitle
      || [property?.street, property?.town, property?.postcode].filter(Boolean).join(', ')
      || 'Property Viewing';
    const propertyTitleKey = String(property?.street || propertyTitle).trim().toLowerCase();
    const tenantId = callerIsManager ? (data?.tenantId || '') : callerId;
    const id = `viewing_${tenantId || callerId}_${Date.now()}`;
    const now = new Date().toISOString();

    const payload: any = {
      id,
      userId: callerIsManager ? (data?.userId || callerId) : callerId,
      tenantEmail,
      propertyId: data?.propertyId || null,
      propertyTitle,
      requestedDate,
      requestedTime,
      status,
      notes: data?.notes || '',
      createdAt: now,
      updatedAt: now,
    };
    if (tenantId) payload.tenantId = tenantId;
    if (propertyTitleKey) payload.propertyTitleKey = propertyTitleKey;
    if (landlordId) payload.landlordId = landlordId;
    if (landlordEmail) payload.landlordEmail = landlordEmail;
    if (agentId) payload.agentId = agentId;
    if (agentEmail) payload.agentEmail = agentEmail;
    if (property) payload.property = property;
    if (details) payload.viewingDetails = details;
    if (data?.agentNotes) payload.agentNotes = data.agentNotes;

    if (col) {
      try {
        await col.doc(id).set(payload);
      } catch (err: any) {
        console.warn('[ViewingRequestService] createViewing error:', err?.message || err);
      }
    }
    return this.presentViewing(id, payload);
  }

  async getViewingRequests(userId: string, _role: string, email?: string) {
    const col = this.collection;
    if (!col || !userId) return [];
    try {
      const emails = await this.collectEmails(email || '', userId);
      const tasks: Promise<Array<{ id: string; data: any }>>[] = [];
      for (const field of ['tenantId', 'userId', 'landlordId', 'agentId']) {
        tasks.push(this.docsFor(field, userId));
      }
      for (const address of emails) {
        for (const field of ['tenantEmail', 'landlordEmail', 'agentEmail']) {
          tasks.push(this.docsFor(field, address));
        }
      }
      const owned = await this.ownedProperties(userId, emails);
      for (const propertyId of owned.ids) {
        tasks.push(this.docsFor('propertyId', propertyId));
      }
      for (const title of owned.titles) {
        tasks.push(this.docsFor('propertyTitle', title));
        tasks.push(this.docsFor('propertyTitleKey', title.toLowerCase()));
        tasks.push(this.docsFor('property.street', title));
      }

      const groups = await Promise.all(tasks);
      const byId = new Map<string, any>();
      const addRow = (id: string, data: any) => {
        if (!byId.has(id)) byId.set(id, this.presentViewing(id, data));
      };
      for (const group of groups) {
        for (const row of group) addRow(row.id, row.data);
      }
      for (const row of await this.recentViewingsForOwner(owned.titles, emails)) {
        addRow(row.id, row.data);
      }

      return Array.from(byId.values())
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
        .slice(0, 100);
    } catch (err: any) {
      console.warn('[ViewingRequestService] getViewingRequests error:', err?.message || err);
      return [];
    }
  }

  /** A typed dashboard address has no listing id. Match it to a property this account owns. */
  private async ownedProperties(userId: string, emails: Set<string>): Promise<{ ids: string[]; titles: string[] }> {
    const db = this.db;
    if (!db) return { ids: [], titles: [] };
    const col = db.collection('properties');
    const ids = new Set<string>();
    const titles = new Set<string>();
    const addDoc = (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      ids.add(doc.id);
      const data = doc.data() || {};
      for (const value of [data.address, data.street, data.title, data.name]) {
        const text = String(value || '').trim();
        if (text.length < 4 || text.toLowerCase() === 'property viewing') continue;
        titles.add(text);
        const firstLine = text.split(',')[0].trim();
        if (firstLine.length >= 4) titles.add(firstLine);
      }
    };
    const collect = async (field: string, value: string) => {
      if (!value) return;
      try {
        const snapshot = await col.where(field, '==', value).limit(50).get();
        snapshot.docs.forEach(addDoc);
      } catch (err: any) {
        console.warn(`[ViewingRequestService] property query ${field} failed:`, err?.message || err);
      }
    };

    const tasks = [
      collect('userId', userId),
      collect('landlordId', userId),
    ];
    for (const address of emails) {
      tasks.push(collect('ownerEmail', address));
      tasks.push(collect('agent.email', address));
    }
    await Promise.all(tasks);
    return {
      ids: Array.from(ids).slice(0, 40),
      titles: Array.from(titles).slice(0, 40),
    };
  }

  private async managerIdForEmail(email: string): Promise<string> {
    const db = this.db;
    if (!db || !email) return '';
    try {
      const snapshot = await db.collection('users').where('email', '==', email).limit(5).get();
      const matches = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
      const manager = matches.find((user) => user.role === 'landlord' || user.role === 'agent')
        || matches.find((user) => user.role !== 'tenant');
      return manager?.id || '';
    } catch (err: any) {
      console.warn('[ViewingRequestService] manager email lookup failed:', err?.message || err);
      return '';
    }
  }

  private titleKey(value: unknown): string {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /** Older saves have no landlord id. Match a recent viewing to an owned address or agent email. */
  private async recentViewingsForOwner(titles: string[], emails: Set<string>): Promise<Array<{ id: string; data: any }>> {
    const col = this.collection;
    if (!col || (titles.length === 0 && emails.size === 0)) return [];
    const titleKeys = new Set(titles.map((title) => this.titleKey(title)).filter((title) => title.length >= 4));
    let docs: Array<{ id: string; data: any }> = [];
    try {
      const snapshot = await col.orderBy('createdAt', 'desc').limit(100).get();
      docs = snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
    } catch {
      try {
        const snapshot = await col.limit(100).get();
        docs = snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
      } catch (err: any) {
        console.warn('[ViewingRequestService] recent viewing lookup failed:', err?.message || err);
        return [];
      }
    }

    return docs.filter((row) => {
      const data = row.data || {};
      const agent = this.titleKey(data.agentEmail || data.property?.agent?.email || data.landlordEmail);
      if (agent && emails.has(agent)) return true;
      const title = this.titleKey(data.propertyTitle || data.property?.street || data.address);
      const firstLine = title.split(',')[0].trim();
      return Boolean(title && (titleKeys.has(title) || titleKeys.has(firstLine)));
    });
  }

  private async docsFor(field: string, value: string): Promise<Array<{ id: string; data: any }>> {
    const col = this.collection;
    if (!col || !value) return [];
    try {
      const snapshot = await col.where(field, '==', value).limit(100).get();
      return snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
    } catch (err: any) {
      console.warn(`[ViewingRequestService] query ${field} failed:`, err?.message || err);
      return [];
    }
  }

  private assertViewingAccess(viewing: any, user?: any) {
    if (!user) return;
    const isAdmin = user.admin === true || user.role === 'admin';
    if (isAdmin) return;
    const email = typeof user.email === 'string' ? user.email.toLowerCase() : '';
    const sameEmail = (value: unknown) =>
      typeof value === 'string' && email && value.toLowerCase() === email;
    const isOwner =
      viewing?.tenantId === user.uid ||
      viewing?.userId === user.uid ||
      viewing?.landlordId === user.uid ||
      viewing?.agentId === user.uid ||
      sameEmail(viewing?.tenantEmail) ||
      sameEmail(viewing?.landlordEmail) ||
      sameEmail(viewing?.agentEmail) ||
      sameEmail(viewing?.viewingDetails?.userDetails?.email) ||
      sameEmail(viewing?.property?.agent?.email);
    if (!isOwner) {
      throw new ForbiddenException('You are not authorized to access or modify this viewing request');
    }
  }

  async getViewingById(id: string, user?: any) {
    const col = this.collection;
    if (!col) throw new NotFoundException('Viewing request not found');
    try {
      const doc = await col.doc(id).get();
      if (!doc.exists) throw new NotFoundException('Viewing request not found');
      const data = doc.data();
      this.assertViewingAccess(data, user);
      return this.presentViewing(doc.id, data);
    } catch (err: any) {
      if (err?.status === 403 || err?.status === 404) throw err;
      console.warn('[ViewingRequestService] getViewingById error:', err?.message || err);
      throw new NotFoundException('Viewing request not found');
    }
  }

  async updateViewingStatus(
    id: string,
    userId: string,
    status: string,
    notes?: string,
    user?: any,
    extras?: { agentNotes?: string; viewingDetails?: any },
  ) {
    const col = this.collection;
    if (!col) return { id, status };
    try {
      const docRef = col.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) throw new NotFoundException('Viewing request not found');
      const data = doc.data() || {};
      this.assertViewingAccess(data, user || { uid: userId });

      const nextStatus = this.canonicalStatus(status, this.canonicalStatus(data.status));
      const now = new Date().toISOString();
      const payload: any = { status: nextStatus, updatedAt: now };
      if (notes) payload.notes = notes;
      if (extras?.agentNotes) payload.agentNotes = extras.agentNotes;
      if (extras?.viewingDetails && typeof extras.viewingDetails === 'object') {
        payload.viewingDetails = extras.viewingDetails;
        if (extras.viewingDetails.date) payload.requestedDate = extras.viewingDetails.date;
        if (extras.viewingDetails.time) payload.requestedTime = extras.viewingDetails.time;
      }
      if (nextStatus === 'confirmed') payload.confirmedAt = now;
      if (nextStatus === 'completed') payload.completedAt = now;
      if (nextStatus === 'cancelled') payload.cancelledAt = now;
      if (nextStatus === 'rescheduled') payload.rescheduledAt = now;

      await docRef.update(payload);
      return this.presentViewing(id, { ...data, ...payload });
    } catch (err: any) {
      if (err?.status === 403 || err?.status === 404) throw err;
      console.warn('[ViewingRequestService] updateViewingStatus error:', err?.message || err);
      return { id, status };
    }
  }

  async cancelViewing(id: string, userId: string, user?: any) {
    const col = this.collection;
    if (!col) return { success: true, message: 'Viewing request cancelled' };
    try {
      const docRef = col.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) throw new NotFoundException('Viewing request not found');
      const data = doc.data();
      this.assertViewingAccess(data, user || { uid: userId });

      await docRef.update({
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { success: true, message: 'Viewing request cancelled' };
    } catch (err: any) {
      if (err?.status === 403 || err?.status === 404) throw err;
      console.warn('[ViewingRequestService] cancelViewing error:', err?.message || err);
      return { success: true, message: 'Viewing request cancelled' };
    }
  }
}
