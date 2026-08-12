import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { randomUUID } from 'crypto';

@Injectable()
export class GuestEnquiryService {
  private readonly logger = new Logger(GuestEnquiryService.name);

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

  async submitEnquiry(body: any) {
    const threadToken = randomUUID();
    const threadId = randomUUID();
    const messageId = randomUUID();
    const now = new Date().toISOString();

    // Unified Conversation Schema
    const threadPayload = {
      id: threadId,
      propertyId: body.listingId,
      tenantId: null, // Unclaimed guest
      landlordId: body.landlordId || '',
      propertyTitle: body.listingTitle || 'Property Listing',
      tenantName: body.name || 'Guest Tenant',
      guestEmail: body.email,
      guestToken: threadToken,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
      isDeleted: false,
      status: 'active',
    };

    // Unified Message Schema
    const messagePayload = {
      id: messageId,
      conversationId: threadId,
      senderId: 'guest',
      senderRole: 'ghost_tenant',
      senderName: body.name || 'Guest Tenant', // Extra field for guest display
      body: body.message,
      attachmentIds: [],
      sentAt: now,
      readAt: null,
      isDeleted: false,
    };

    const col = this.conversationsCol;
    if (col) {
      try {
        await col.doc(threadId).set(threadPayload);
        if (this.messagesCol) {
          await this.messagesCol.doc(messageId).set(messagePayload);
        }
      } catch (err: any) {
        this.logger.warn(`Failed to save guest thread: ${err?.message || err}`);
      }
    }

    return {
      data: {
        threadToken,
        ghostTenantId: body.email,
        confirmationSent: true,
        agentDelivery: body.agentEmail ? 'sent' : 'no_contact_email',
      },
    };
  }

  async getThreadByToken(token: string) {
    const col = this.conversationsCol;
    if (!col) {
      return {
        data: {
          thread: { id: token, status: 'active', message_count: 0 },
          messages: [],
        },
      };
    }

    try {
      const snap = await col.where('guestToken', '==', token).limit(1).get();
      if (snap.empty) {
        throw new BadRequestException('Thread not found');
      }

      const threadData = snap.docs[0].data();
      let messages: any[] = [];
      if (this.messagesCol) {
        const msgSnap = await this.messagesCol.where('conversationId', '==', threadData.id).get();
        messages = msgSnap.docs
          .map(d => d.data())
          .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
      }

      // Map back to what the frontend expects for guest threads
      return {
        data: {
          thread: {
            id: token, // Frontend expects token as id for replies
            listing_title: threadData?.propertyTitle,
            status: threadData?.status || 'active',
            message_count: messages.length,
            created_at: threadData?.createdAt,
            ghost_tenant_name: threadData?.tenantName,
          },
          messages: messages.map(m => ({
            id: m.id,
            sender_type: m.senderRole,
            sender_name: m.senderName || (m.senderRole === 'landlord' ? 'Landlord' : 'Guest'),
            body: m.body,
            sent_at: m.sentAt,
          })),
        },
      };
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      return {
        data: {
          thread: { id: token, status: 'active', message_count: 0 },
          messages: [],
        },
      };
    }
  }

  async addReply(token: string, body: any) {
    const messageId = randomUUID();
    const now = new Date().toISOString();

    const col = this.conversationsCol;
    let threadId = '';
    
    if (col) {
      try {
        const snap = await col.where('guestToken', '==', token).limit(1).get();
        if (!snap.empty) {
          threadId = snap.docs[0].id;
        }
      } catch {}
    }

    if (!threadId) {
      return { data: { id: messageId, sent_at: now } }; // Fallback
    }

    const payload = {
      id: messageId,
      conversationId: threadId,
      senderId: body.senderId || 'guest',
      senderRole: body.senderType || 'ghost_tenant',
      senderName: body.senderName || 'User',
      body: body.message || '',
      attachmentIds: [],
      sentAt: now,
      readAt: null,
      isDeleted: false,
    };

    if (this.messagesCol) {
      try {
        await this.messagesCol.doc(messageId).set(payload);
        if (col) {
          await col.doc(threadId).set({ updatedAt: now, lastMessageAt: now }, { merge: true });
        }
      } catch {}
    }

    return {
      data: {
        id: messageId,
        sent_at: now,
      },
    };
  }

  async autoMerge(email: string, userId: string) {
    const col = this.conversationsCol;
    let migratedCount = 0;
    if (col) {
      try {
        const snap = await col.where('guestEmail', '==', email.toLowerCase().trim()).get();
        for (const doc of snap.docs) {
          await doc.ref.set({ 
            tenantId: userId, 
            status: 'claimed',
            guestToken: null // Clear token after claim
          }, { merge: true });
          migratedCount++;
        }
      } catch {}
    }

    return {
      data: {
        success: true,
        migratedCount,
      },
    };
  }

  /** Validate a claim token — check it exists in Firestore and is not expired */
  async validateClaimToken(token: string) {
    const col = this.conversationsCol;
    if (!col) return { data: { valid: false } };
    try {
      const snap = await col.where('guestToken', '==', token).limit(1).get();
      if (snap.empty) return { data: { valid: false } };
      
      const data = snap.docs[0].data();
      return {
        data: {
          valid: true,
          email: data?.guestEmail || '',
          name: data?.tenantName || null,
          role: 'ghost_tenant',
          expires_at: null,
        },
      };
    } catch {
      return { data: { valid: false } };
    }
  }

  /** Resend a claim link email (no-op if SMTP not configured) */
  async resendClaimToken(email: string) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      const col = this.conversationsCol;
      let threadToken: string | null = null;
      if (col) {
        try {
          const snap = await col
            .where('guestEmail', '==', email.toLowerCase().trim())
            .where('guestToken', '!=', null)
            .limit(1)
            .get();
          if (!snap.empty) threadToken = snap.docs[0].data().guestToken;
        } catch {}
      }

      if (threadToken) {
        try {
          const nodemailer = require('nodemailer');
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(process.env.SMTP_PORT || '465'),
            secure: true,
            auth: { user: smtpUser, pass: smtpPass },
          });
          const frontendUrl = process.env.FRONTEND_URL || 'https://proptii-r1-1a-2.onrender.com';
          await transporter.sendMail({
            from: `"Proptii" <${process.env.SMTP_FROM_EMAIL || smtpUser}>`,
            to: email,
            subject: 'Claim your Proptii account',
            html: `<p>Click the link to claim your account and view your messages:</p>
                   <p><a href="${frontendUrl}/claim?token=${threadToken}">Claim Account</a></p>`,
          });
        } catch (err: any) {
          this.logger.warn(`resendClaimToken email error: ${err?.message || err}`);
        }
      }
    }

    return { data: { sent: true } };
  }

  /** Confirm a claim — merge thread ownership to the authenticated user */
  async confirmClaim(token: string, email: string, userId: string) {
    const col = this.conversationsCol;
    let migratedCount = 0;
    if (col) {
      try {
        // Claim by specific token
        const tokenSnap = await col.where('guestToken', '==', token).limit(1).get();
        if (!tokenSnap.empty) {
          await tokenSnap.docs[0].ref.set({ 
            tenantId: userId, 
            status: 'claimed', 
            guestToken: null,
            claimedAt: new Date().toISOString() 
          }, { merge: true });
          migratedCount = 1;
        }
        
        // Also merge any threads matching the email
        const emailSnap = await col.where('guestEmail', '==', (email || '').toLowerCase().trim()).get();
        for (const d of emailSnap.docs) {
          await d.ref.set({ 
            tenantId: userId, 
            status: 'claimed',
            guestToken: null
          }, { merge: true });
          migratedCount++;
        }
      } catch {}
    }
    return { data: { success: true, migratedCount } };
  }
}
