import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';
import { EmailService } from './email.service';
import { UserProfileService } from './user-profile.service';
@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly userProfileService: UserProfileService,
  ) {}

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

        // Fire email notification asynchronously
        this.notifyRecipient(conversationId, message, userId).catch(err => {
          this.logger.error(`Background email notification failed: ${err?.message || err}`);
        });

      } catch (err: any) {
        this.logger.warn(`Error sending message: ${err?.message || err}`);
      }
    }

    return { data: message };
  }

  private async notifyRecipient(conversationId: string, message: any, senderId: string) {
    if (!this.conversationsCol) return;
    const convSnap = await this.conversationsCol.doc(conversationId).get();
    if (!convSnap.exists) return;
    const conv = convSnap.data();
    if (!conv) return;

    let recipientId = '';
    let isGuest = false;

    // Determine recipient
    if (senderId === conv.tenantId) {
      recipientId = conv.landlordId; // Tenant to Landlord
    } else if (senderId === conv.landlordId) {
      recipientId = conv.tenantId; // Landlord to Tenant
      if (!recipientId && conv.guestEmail) {
        isGuest = true; // Landlord replying to unverified guest
      }
    } else if (senderId === 'guest') {
      recipientId = conv.landlordId; // Guest to Landlord
    } else {
      return; // Unknown flow
    }

    let recipientEmail = '';
    let recipientName = '';
    
    if (isGuest && conv.guestEmail) {
      recipientEmail = conv.guestEmail;
      recipientName = conv.tenantName || 'Guest';
    } else if (recipientId) {
      const profile = await this.userProfileService.getProfile(recipientId) as any;
      recipientEmail = profile?.email || '';
      recipientName = profile?.name || profile?.displayName || (recipientId === conv.landlordId ? 'Landlord' : (conv.tenantName || 'Tenant'));
    }

    if (recipientEmail) {
      const senderName = message.senderName || (senderId === conv.landlordId ? 'Landlord' : (conv.tenantName || 'Tenant'));
      await this.emailService.sendNewMessageNotification(
        recipientEmail,
        recipientName,
        senderName,
        conv.propertyTitle || 'a property',
        isGuest,
        isGuest ? conv.guestToken : undefined
      );
    }
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

  // ── Attachments ───────────────────────────────────────────────────────────

  private get attachmentsCol() {
    const db = this.db;
    return db ? db.collection('message_attachments') : null;
  }

  async getAttachment(attachmentId: string) {
    const col = this.attachmentsCol;
    if (!col) return { data: null };
    try {
      const doc = await col.doc(attachmentId).get();
      if (!doc.exists) return { data: null };
      return { data: { id: doc.id, ...doc.data() } };
    } catch {
      return { data: null };
    }
  }

  async saveAttachment(userId: string, dto: any) {
    const col = this.attachmentsCol;
    const id = randomUUID();
    const now = new Date().toISOString();
    const payload = {
      id,
      uploadedBy: userId,
      filename: dto.filename || dto.name || 'attachment',
      mimeType: dto.mimeType || dto.contentType || 'application/octet-stream',
      size: dto.size || 0,
      blobUrl: dto.blobUrl || dto.url || '',
      conversationId: dto.conversationId || null,
      messageId: dto.messageId || null,
      createdAt: now,
    };
    if (col) {
      try { await col.doc(id).set(payload); } catch {}
    }
    return { data: payload };
  }

  async deleteAttachment(attachmentId: string) {
    const col = this.attachmentsCol;
    if (col) {
      try { await col.doc(attachmentId).delete(); } catch {}
    }
    return { data: { success: true } };
  }
}
