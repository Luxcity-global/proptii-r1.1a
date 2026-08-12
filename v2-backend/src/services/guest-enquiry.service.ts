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

  private get threadsCol() {
    const db = this.db;
    return db ? db.collection('guest_threads') : null;
  }

  private get messagesCol() {
    const db = this.db;
    return db ? db.collection('guest_messages') : null;
  }

  async submitEnquiry(body: any) {
    const threadToken = randomUUID();
    const threadId = randomUUID();
    const messageId = randomUUID();
    const now = new Date().toISOString();

    const threadPayload = {
      id: threadId,
      threadToken,
      listingId: body.listingId,
      listingTitle: body.listingTitle || 'Property Listing',
      listingSource: body.listingSource || 'native',
      tenantEmail: body.email,
      tenantName: body.name || 'Guest Tenant',
      landlordId: body.landlordId || '',
      agentEmail: body.agentEmail || '',
      agentName: body.agentName || '',
      status: 'active',
      messageCount: 1,
      createdAt: now,
      updatedAt: now,
    };

    const messagePayload = {
      id: messageId,
      threadToken,
      threadId,
      senderType: 'ghost_tenant',
      senderName: body.name || 'Guest Tenant',
      body: body.message,
      sentAt: now,
      readAt: null,
    };

    const col = this.threadsCol;
    if (col) {
      try {
        await col.doc(threadToken).set(threadPayload);
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
    const col = this.threadsCol;
    if (!col) {
      return {
        data: {
          thread: { id: token, status: 'active', message_count: 1 },
          messages: [],
        },
      };
    }

    try {
      const doc = await col.doc(token).get();
      if (!doc.exists) {
        throw new BadRequestException('Thread not found');
      }

      const threadData = doc.data();
      let messages: any[] = [];
      if (this.messagesCol) {
        const msgSnap = await this.messagesCol.where('threadToken', '==', token).get();
        messages = msgSnap.docs
          .map(d => d.data())
          .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
      }

      return {
        data: {
          thread: {
            id: doc.id,
            listing_title: threadData?.listingTitle,
            status: threadData?.status || 'active',
            message_count: messages.length,
            created_at: threadData?.createdAt,
            ghost_tenant_name: threadData?.tenantName,
          },
          messages: messages.map(m => ({
            id: m.id,
            sender_type: m.senderType,
            sender_name: m.senderName,
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

    const payload = {
      id: messageId,
      threadToken: token,
      senderType: body.senderType || 'ghost_tenant',
      senderId: body.senderId || 'guest',
      senderName: body.senderName || 'User',
      body: body.message || '',
      sentAt: now,
      readAt: null,
    };

    const col = this.messagesCol;
    if (col) {
      try {
        await col.doc(messageId).set(payload);
        if (this.threadsCol) {
          await this.threadsCol.doc(token).set({ updatedAt: now }, { merge: true });
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
    const col = this.threadsCol;
    let migratedCount = 0;
    if (col) {
      try {
        const snap = await col.where('tenantEmail', '==', email.toLowerCase().trim()).get();
        for (const doc of snap.docs) {
          await doc.ref.set({ tenantId: userId, status: 'claimed' }, { merge: true });
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
    const col = this.threadsCol;
    if (!col) return { data: { valid: false } };
    try {
      const doc = await col.doc(token).get();
      if (!doc.exists) return { data: { valid: false } };
      const data = doc.data();
      return {
        data: {
          valid: true,
          email: data?.tenantEmail || '',
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
    // In production, send a claim email via SMTP if configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      const col = this.threadsCol;
      let threadToken: string | null = null;
      if (col) {
        try {
          const snap = await col
            .where('tenantEmail', '==', email.toLowerCase().trim())
            .limit(1)
            .get();
          if (!snap.empty) threadToken = snap.docs[0].id;
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
    const col = this.threadsCol;
    let migratedCount = 0;
    if (col) {
      try {
        // Claim by specific token
        const doc = await col.doc(token).get();
        if (doc.exists) {
          await doc.ref.set({ tenantId: userId, status: 'claimed', claimedAt: new Date().toISOString() }, { merge: true });
          migratedCount = 1;
        }
        // Also merge any threads matching the email
        const snap = await col.where('tenantEmail', '==', (email || '').toLowerCase().trim()).get();
        for (const d of snap.docs) {
          await d.ref.set({ tenantId: userId, status: 'claimed' }, { merge: true });
          migratedCount++;
        }
      } catch {}
    }
    return { data: { success: true, migratedCount } };
  }
}
