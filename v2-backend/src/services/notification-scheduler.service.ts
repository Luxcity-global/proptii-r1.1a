import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as admin from 'firebase-admin';
import { EmailService } from './email.service';
import { UserProfileService } from './user-profile.service';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly userProfileService: UserProfileService,
  ) {}

  private get db(): FirebaseFirestore.Firestore | null {
    if (!admin.apps.length) return null;
    try {
      return admin.firestore();
    } catch {
      return null;
    }
  }

  /**
   * Runs every hour. Finds conversations with unread messages that have not
   * had a reminder sent in the last 24 hours, then emails the relevant party.
   *
   * Uses lastNotifiedAt (24h dedup for scheduler) which is separate from
   * immediateNotifiedAt (10-min dedup for per-send notifications in CommunicationService).
   */
  @Cron('0 * * * *')
  async checkUnreadReminders(): Promise<void> {
    const db = this.db;
    if (!db) {
      this.logger.warn('[scheduler] Firestore unavailable — skipping unread reminder check');
      return;
    }

    this.logger.log('[scheduler] Starting unread reminder check');

    try {
      const conversationsCol = db.collection('conversations');

      // Firestore does not support OR queries across different fields, so we
      // run two separate queries and de-duplicate by document ID using a Map.
      const [tenantSnap, landlordSnap] = await Promise.all([
        conversationsCol.where('unreadForTenant', '>', 0).get(),
        conversationsCol.where('unreadForLandlord', '>', 0).get(),
      ]);

      const convMap = new Map<string, admin.firestore.QueryDocumentSnapshot>();
      tenantSnap.docs.forEach(doc => convMap.set(doc.id, doc));
      landlordSnap.docs.forEach(doc => convMap.set(doc.id, doc));

      this.logger.log(`[scheduler] Checking ${convMap.size} conversation(s) with unread messages`);

      const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

      for (const [, doc] of convMap) {
        try {
          const conv = doc.data();
          if (conv.isDeleted === true) continue;

          // Determine if the 24-hour threshold has been crossed since the last reminder
          const lastNotifiedAt: string | null = conv.lastNotifiedAt ?? null;
          const needsReminder =
            !lastNotifiedAt ||
            Date.now() - new Date(lastNotifiedAt).getTime() >= TWENTY_FOUR_HOURS_MS;

          if (!needsReminder) continue;

          let notified = false;

          // Notify tenant if they have unread messages
          if ((conv.unreadForTenant ?? 0) > 0 && conv.tenantId) {
            const profile = await this.userProfileService.getProfile(conv.tenantId);
            const recipientEmail: string = profile?.email || '';
            const recipientName: string = profile?.name || profile?.displayName || conv.tenantName || 'Tenant';

            if (recipientEmail) {
              await this.emailService.sendUnreadReminderNotification({
                recipientEmail,
                recipientName,
                propertyTitle: conv.propertyTitle || 'a property',
                unreadCount: conv.unreadForTenant,
              });
              notified = true;
            }
          }

          // Notify landlord if they have unread messages
          if ((conv.unreadForLandlord ?? 0) > 0 && conv.landlordId) {
            const profile = await this.userProfileService.getProfile(conv.landlordId);
            const recipientEmail: string = profile?.email || '';
            const recipientName: string = profile?.name || profile?.displayName || 'Landlord';

            if (recipientEmail) {
              await this.emailService.sendUnreadReminderNotification({
                recipientEmail,
                recipientName,
                propertyTitle: conv.propertyTitle || 'a property',
                unreadCount: conv.unreadForLandlord,
              });
              notified = true;
            }
          }

          // Update lastNotifiedAt after at least one reminder was sent
          if (notified) {
            await conversationsCol.doc(doc.id).set(
              { lastNotifiedAt: new Date().toISOString() },
              { merge: true },
            );
          }
        } catch (err: any) {
          this.logger.error(
            `[scheduler] Error processing conversation ${doc.id}: ${err?.message || err}`,
          );
          // Continue to next conversation rather than aborting the entire run
        }
      }

      this.logger.log('[scheduler] Unread reminder check complete');
    } catch (err: any) {
      this.logger.error(`[scheduler] Fatal error in checkUnreadReminders: ${err?.message || err}`);
    }
  }
}
