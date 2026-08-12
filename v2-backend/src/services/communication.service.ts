import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  private get db() {
    if (!admin.apps.length) return null;
    try {
      return admin.firestore();
    } catch {
      return null;
    }
  }

  private get conversationsCol() {
    const db = this.db;
    return db ? db.collection('conversations') : null;
  }

  private get messagesCol() {
    const db = this.db;
    return db ? db.collection('messages') : null;
  }

  async getConversations(userId: string) {
    const col = this.conversationsCol;
    if (!col) return { data: [] };

    try {
      const [tenantSnap, landlordSnap] = await Promise.all([
        col.where('tenantId', '==', userId).get(),
        col.where('landlordId', '==', userId).get(),
      ]);

      const convMap = new Map<string, any>();
      tenantSnap.docs.forEach(doc => convMap.set(doc.id, { id: doc.id, ...doc.data(), messages: [] }));
      landlordSnap.docs.forEach(doc => convMap.set(doc.id, { id: doc.id, ...doc.data(), messages: [] }));

      const list = Array.from(convMap.values()).sort((a, b) => {
        const tA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return tB - tA;
      });

      return { data: list };
    } catch (err: any) {
      this.logger.warn(`Failed to get conversations for ${userId}: ${err?.message || err}`);
      return { data: [] };
    }
  }

  async getUnreadCount(userId: string) {
    const convsRes = await this.getConversations(userId);
    const convIds = convsRes.data.map((c: any) => c.id);
    if (!convIds.length) return { data: { unreadCount: 0 } };

    const col = this.messagesCol;
    if (!col) return { data: { unreadCount: 0 } };

    try {
      const snapshot = await col
        .where('readAt', '==', null)
        .where('senderId', '!=', userId)
        .get();

      const userUnread = snapshot.docs.filter(doc => convIds.includes(doc.data().conversationId));
      return { data: { unreadCount: userUnread.length } };
    } catch {
      return { data: { unreadCount: 0 } };
    }
  }

  async getOrCreateConversation(dto: any, currentUserId: string) {
    const col = this.conversationsCol;
    const propertyId = dto.propertyId || '';
    const tenantId = dto.tenantId || currentUserId;
    const landlordId = dto.landlordId || '';

    if (col) {
      try {
        const snapshot = await col
          .where('propertyId', '==', propertyId)
          .where('tenantId', '==', tenantId)
          .where('landlordId', '==', landlordId)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          return { data: { id: doc.id, ...doc.data(), messages: [] } };
        }
      } catch (err: any) {
        this.logger.warn(`Error finding conversation: ${err?.message || err}`);
      }
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const payload = {
      id,
      propertyId,
      tenantId,
      landlordId,
      propertyTitle: dto.propertyTitle || 'Property Listing',
      tenantName: dto.tenantName || 'Tenant',
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
      isDeleted: false,
    };

    if (col) {
      try {
        await col.doc(id).set(payload);
      } catch (err: any) {
        this.logger.warn(`Failed to save conversation: ${err?.message || err}`);
      }
    }

    return { data: { ...payload, messages: [] } };
  }

  async getMessages(conversationId: string) {
    const col = this.messagesCol;
    if (!col) return { data: [] };

    try {
      const snapshot = await col
        .where('conversationId', '==', conversationId)
        .get();

      const messages = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());

      return { data: messages };
    } catch (err: any) {
      this.logger.warn(`Error getting messages for ${conversationId}: ${err?.message || err}`);
      return { data: [] };
    }
  }

  async sendMessage(conversationId: string, dto: any, userId: string) {
    const col = this.messagesCol;
    const timestamp = new Date().toISOString();
    const id = randomUUID();

    const message = {
      id,
      conversationId,
      senderId: userId,
      body: dto.body || dto.text || '',
      attachmentIds: dto.attachmentIds || [],
      senderRole: dto.senderRole || 'tenant',
      sentAt: timestamp,
      readAt: null,
      isDeleted: false,
    };

    if (col) {
      try {
        await col.doc(id).set(message);
        if (this.conversationsCol) {
          await this.conversationsCol.doc(conversationId).set(
            { updatedAt: timestamp, lastMessageAt: timestamp },
            { merge: true }
          );
        }
      } catch (err: any) {
        this.logger.warn(`Error sending message: ${err?.message || err}`);
      }
    }

    return { data: message };
  }

  async markRead(messageId: string) {
    const col = this.messagesCol;
    if (col) {
      try {
        await col.doc(messageId).set({ readAt: new Date().toISOString() }, { merge: true });
      } catch {}
    }
    return { data: { success: true } };
  }
}
