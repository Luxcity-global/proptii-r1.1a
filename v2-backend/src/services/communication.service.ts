import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
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
      tenantSnap.docs.forEach(doc => {
        const d = doc.data();
        if (d.isDeleted !== true) convMap.set(doc.id, { id: doc.id, ...d, messages: [] });
      });
      landlordSnap.docs.forEach(doc => {
        const d = doc.data();
        if (d.isDeleted !== true) convMap.set(doc.id, { id: doc.id, ...d, messages: [] });
      });

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
    // Fast path: sum the stored unread counter fields instead of a cross-collection scan
    const col = this.conversationsCol;
    if (!col) return { data: { unreadCount: 0 } };

    try {
      const [tenantSnap, landlordSnap] = await Promise.all([
        col.where('tenantId', '==', userId).get(),
        col.where('landlordId', '==', userId).get(),
      ]);

      const convMap = new Map<string, any>();
      tenantSnap.docs.forEach(doc => {
        const d = doc.data();
        if (d.isDeleted !== true) convMap.set(doc.id, d);
      });
      landlordSnap.docs.forEach(doc => {
        const d = doc.data();
        if (d.isDeleted !== true) convMap.set(doc.id, d);
      });

      let unreadCount = 0;
      for (const [, conv] of convMap) {
        // For each conversation, add the counter for the field that applies to userId
        if (conv.tenantId === userId) {
          unreadCount += (conv.unreadForTenant ?? 0);
        } else if (conv.landlordId === userId) {
          unreadCount += (conv.unreadForLandlord ?? 0);
        }
      }
      return { data: { unreadCount } };
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
          return { data: { id: doc.id, ...doc.data(), messages: [] }, isNew: false };
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
      lastMessageAt: null,       // null until the first real message is sent
      lastMessagePreview: null,
      unreadForTenant: 0,
      unreadForLandlord: 0,
      isDeleted: false,
    };

    if (col) {
      try {
        await col.doc(id).set(payload);
      } catch (err: any) {
        this.logger.warn(`Failed to save conversation: ${err?.message || err}`);
      }
    }

    return { data: { ...payload, messages: [] }, isNew: true };
  }

  async getMessages(conversationId: string, user?: { uid: string; email?: string; admin?: boolean; role?: string }, before?: string, limit = 50) {
    const col = this.messagesCol;
    if (!col) return { data: [], hasMore: false };

    // Verify participant authorization if caller user context is provided
    if (user && user.admin !== true && user.role !== 'admin' && this.conversationsCol) {
      const convSnap = await this.conversationsCol.doc(conversationId).get();
      if (convSnap.exists) {
        const conv = convSnap.data();
        const isParticipant =
          conv?.tenantId === user.uid ||
          conv?.landlordId === user.uid ||
          (user.email && (
            conv?.guestEmail?.toLowerCase() === user.email.toLowerCase() ||
            conv?.landlordEmail?.toLowerCase() === user.email.toLowerCase()
          ));
        if (!isParticipant) {
          throw new ForbiddenException('You are not authorized to view messages in this conversation');
        }
      }
    }

    try {
      // Build cursor-paginated query — newest-first then reverse for display.
      // Note: we intentionally do NOT filter by isDeleted here because:
      // 1. Older messages don't have this field, so isDeleted==false would exclude them
      // 2. Firestore requires a composite index for (conversationId + isDeleted + sentAt)
      //    which may not exist in all environments. Filter client-side instead.
      let query: any = col
        .where('conversationId', '==', conversationId)
        .limit(200); // Temporary fallback to avoid missing composite index error

      const snapshot = await query.get();
      const hasMore = false; // Disable pagination while using fallback
      const docs = snapshot.docs;
      
      // Sort in memory instead
      docs.sort((a: any, b: any) => {
        const tA = new Date(a.data().sentAt).getTime();
        const tB = new Date(b.data().sentAt).getTime();
        return tB - tA; // desc
      });

      // Filter out soft-deleted messages in code (avoids composite index requirement)
      const allMessages = docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      const messages = allMessages
        .filter((m: any) => m.isDeleted !== true)
        .reverse(); // back to chronological order

      // ── Embed attachment objects to eliminate N+1 client-side fetches ──────
      // Instead of the client calling GET /attachments/:id once per attachment
      // per message, we hydrate them here in a single batched Firestore read.
      const attachmentsCol = this.attachmentsCol;
      if (attachmentsCol) {
        // Collect all unique attachment IDs across all messages
        const allAttachmentIds: string[] = [];
        for (const msg of messages as any[]) {
          if (Array.isArray(msg.attachmentIds)) {
            allAttachmentIds.push(...msg.attachmentIds);
          }
        }
        const uniqueIds = [...new Set(allAttachmentIds)];

        if (uniqueIds.length > 0) {
          // Firestore 'in' operator supports up to 30 values per query
          const chunks: string[][] = [];
          for (let i = 0; i < uniqueIds.length; i += 30) {
            chunks.push(uniqueIds.slice(i, i + 30));
          }
          const attachmentMap = new Map<string, any>();
          await Promise.all(
            chunks.map(async (chunk) => {
              const snap = await attachmentsCol.where(admin.firestore.FieldPath.documentId(), 'in', chunk).get();
              snap.docs.forEach(doc => attachmentMap.set(doc.id, { id: doc.id, ...doc.data() }));
            })
          );
          // Attach the hydrated objects alongside the IDs
          for (const msg of messages as any[]) {
            if (Array.isArray(msg.attachmentIds) && msg.attachmentIds.length > 0) {
              msg.attachments = msg.attachmentIds
                .map((id: string) => attachmentMap.get(id))
                .filter(Boolean);
            } else {
              msg.attachments = [];
            }
          }
        } else {
          (messages as any[]).forEach(msg => { msg.attachments = []; });
        }
      }

      return { data: messages, hasMore };
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
      this.logger.warn(`Error getting messages for ${conversationId}: ${err?.message || err}`);
      return { data: [], hasMore: false };
    }
  }

  async sendMessage(conversationId: string, dto: any, userId: string, user?: any) {
    const col = this.messagesCol;
    const timestamp = new Date().toISOString();
    const id = randomUUID();

    // Verify participant authorization if caller user context is provided
    if (user && user.admin !== true && user.role !== 'admin' && this.conversationsCol) {
      const convSnap = await this.conversationsCol.doc(conversationId).get();
      if (convSnap.exists) {
        const conv = convSnap.data();
        const isParticipant =
          conv?.tenantId === userId ||
          conv?.landlordId === userId ||
          (user.email && (
            conv?.guestEmail?.toLowerCase() === user.email.toLowerCase() ||
            conv?.landlordEmail?.toLowerCase() === user.email.toLowerCase()
          ));
        if (!isParticipant) {
          throw new ForbiddenException('You are not authorized to send messages in this conversation');
        }
      }
    }

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
          // Determine which counter to increment based on sender role
          const convSnap = await this.conversationsCol.doc(conversationId).get();
          const conv = convSnap.exists ? convSnap.data() : null;
          const recipientField = conv?.tenantId === userId ? 'unreadForLandlord' : 'unreadForTenant';

          await this.conversationsCol.doc(conversationId).set(
            {
              updatedAt: timestamp,
              lastMessageAt: timestamp,
              lastMessagePreview: (message.body || '').substring(0, 80),
              [recipientField]: admin.firestore.FieldValue.increment(1),
            },
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

  async editMessage(messageId: string, newBody: string, userId: string) {
    if (!this.messagesCol) return { data: null };
    
    const docRef = this.messagesCol.doc(messageId);
    const snap = await docRef.get();
    
    if (!snap.exists) {
      throw new NotFoundException('Message not found');
    }
    
    const msg = snap.data();
    if (msg?.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }
    
    if (msg?.isDeleted) {
      throw new ForbiddenException('Cannot edit a deleted message');
    }

    const editedAt = new Date().toISOString();
    await docRef.update({ 
      body: newBody,
      editedAt
    });

    return { data: { ...msg, body: newBody, editedAt } };
  }

  async deleteMessage(messageId: string, userId: string) {
    if (!this.messagesCol) return { data: null };
    
    const docRef = this.messagesCol.doc(messageId);
    const snap = await docRef.get();
    
    if (!snap.exists) {
      throw new NotFoundException('Message not found');
    }
    
    const msg = snap.data();
    if (msg?.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    const deletedAt = new Date().toISOString();
    await docRef.update({ 
      isDeleted: true,
      deletedAt
    });

    return { data: { ...msg, isDeleted: true, deletedAt } };
  }

  private async notifyRecipient(conversationId: string, message: any, senderId: string) {
    if (!this.conversationsCol) return;
    const convSnap = await this.conversationsCol.doc(conversationId).get();
    if (!convSnap.exists) return;
    const conv = convSnap.data();
    if (!conv) return;

    // ── Email deduplication: skip if notified within the last 10 minutes ──
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    if (conv.lastNotifiedAt) {
      const lastNotified = new Date(conv.lastNotifiedAt).getTime();
      if (Date.now() - lastNotified < TEN_MINUTES_MS) {
        this.logger.debug(`[notify] Skipping — notified ${Math.round((Date.now() - lastNotified) / 1000)}s ago`);
        return;
      }
    }

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
        isGuest ? conv.guestToken : undefined,
        (message.body || '').substring(0, 200), // Pass preview to email
      );

      // Record the notification timestamp to prevent duplicates
      try {
        await this.conversationsCol.doc(conversationId).set(
          { lastNotifiedAt: new Date().toISOString() },
          { merge: true }
        );
      } catch { /* non-fatal */ }
    }
  }

  async markRead(messageId: string, userId?: string) {
    const col = this.messagesCol;
    if (col) {
      try {
        const msgDoc = await col.doc(messageId).get();
        if (msgDoc.exists) {
          const msg = msgDoc.data()!;
          // Only mark read if not already read (avoid double decrement)
          if (!msg.readAt) {
            await col.doc(messageId).set({ readAt: new Date().toISOString() }, { merge: true });

            // Decrement the stored unread counter for the reading user
            if (userId && this.conversationsCol && msg.conversationId) {
              const convSnap = await this.conversationsCol.doc(msg.conversationId).get();
              if (convSnap.exists) {
                const conv = convSnap.data()!;
                const counterField = conv.tenantId === userId ? 'unreadForTenant' : 'unreadForLandlord';
                // Decrement but never below 0
                const current = conv[counterField] ?? 0;
                if (current > 0) {
                  await this.conversationsCol.doc(msg.conversationId).set(
                    { [counterField]: admin.firestore.FieldValue.increment(-1) },
                    { merge: true }
                  );
                }
              }
            }
          }
        } else {
          // Fallback: just set readAt directly
          await col.doc(messageId).set({ readAt: new Date().toISOString() }, { merge: true });
        }
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
      try { 
        await col.doc(id).set(payload); 
        
        // Auto-sync to the "Files/Documents" tab (referencing_files) — tenant uploads only
        // Landlord attachments (replies, contracts) should not appear in the tenant's file vault
        const isLandlordUpload = dto.senderRole === 'landlord';
        const filesCol = this.db?.collection('referencing_files');
        if (filesCol && userId && userId !== 'guest' && !isLandlordUpload) {
          await filesCol.doc(`${userId}_${Date.now()}`).set({
            userId,
            fileName: payload.filename,
            contentType: payload.mimeType,
            size: payload.size,
            category: 'Messaging',
            url: payload.blobUrl,
            uploadDate: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      } catch (err: any) {
        this.logger.warn(`Failed to save attachment or sync to files tab: ${err?.message || err}`);
      }
    }
    return { data: payload };
  }

  async deleteAttachment(attachmentId: string) {
    const col = this.attachmentsCol;
    if (col) {
      try {
        const doc = await col.doc(attachmentId).get();
        if (doc.exists) {
          const data = doc.data();
          if (data?.blobUrl && data.blobUrl.includes('firebasestorage.googleapis.com')) {
            try {
              // Extract the file path from the Firebase Storage URL
              const urlObj = new URL(data.blobUrl);
              const pathRegex = /\/o\/(.+?)\?/;
              const match = urlObj.pathname.match(pathRegex);
              if (match && match[1]) {
                const filePath = decodeURIComponent(match[1]);
                const bucket = admin.storage().bucket();
                await bucket.file(filePath).delete();
                this.logger.log(`Deleted attachment file from storage: ${filePath}`);
              }
            } catch (err: any) {
              this.logger.warn(`Failed to delete attachment from storage: ${err?.message}`);
            }
          }
        }
        await col.doc(attachmentId).delete(); 
      } catch (err: any) {
        this.logger.error(`Error deleting attachment doc: ${err?.message}`);
      }
    }
    return { data: { success: true } };
  }
}
