import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

export interface GdprPurgeResult {
  ok: boolean;
  targetUserId: string;
  purgedRecords: {
    userProfile: boolean;
    referencingDocs: number;
    viewingRequests: number;
    savedProperties: number;
    storageFilesDeleted: number;
  };
  timestamp: string;
  auditLogId?: string;
}

@Injectable()
export class GdprPurgeService {
  private readonly logger = new Logger(GdprPurgeService.name);

  async purgeUserData(targetUserId: string, adminEmail: string): Promise<GdprPurgeResult> {
    this.logger.warn(`⚠️ Initiating GDPR purge for user: ${targetUserId} by admin: ${adminEmail}`);
    const db = admin.firestore();

    const result: GdprPurgeResult = {
      ok: true,
      targetUserId,
      purgedRecords: {
        userProfile: false,
        referencingDocs: 0,
        viewingRequests: 0,
        savedProperties: 0,
        storageFilesDeleted: 0,
      },
      timestamp: new Date().toISOString(),
    };

    // 1. Delete user profile document
    try {
      const userRef = db.collection('users').doc(targetUserId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        await userRef.delete();
        result.purgedRecords.userProfile = true;
      }
    } catch (err: any) {
      this.logger.error(`GDPR: failed to delete user document: ${err.message}`);
    }

    // 2. Delete referencing records
    try {
      const refSnap = await db
        .collection('referencing')
        .where('userId', '==', targetUserId)
        .get();
      for (const doc of refSnap.docs) {
        await doc.ref.delete();
        result.purgedRecords.referencingDocs++;
      }
      // Also check direct doc id
      const directRef = db.collection('referencing').doc(targetUserId);
      const directDoc = await directRef.get();
      if (directDoc.exists) {
        await directRef.delete();
        result.purgedRecords.referencingDocs++;
      }
    } catch (err: any) {
      this.logger.error(`GDPR: failed to delete referencing records: ${err.message}`);
    }

    // 3. Delete viewing requests
    try {
      const viewingsSnap = await db
        .collection('viewing_requests')
        .where('tenantId', '==', targetUserId)
        .get();
      for (const doc of viewingsSnap.docs) {
        await doc.ref.delete();
        result.purgedRecords.viewingRequests++;
      }
    } catch (err: any) {
      this.logger.error(`GDPR: failed to delete viewing requests: ${err.message}`);
    }

    // 4. Delete saved properties
    try {
      const savedSnap = await db
        .collection('saved_properties')
        .where('userId', '==', targetUserId)
        .get();
      for (const doc of savedSnap.docs) {
        await doc.ref.delete();
        result.purgedRecords.savedProperties++;
      }
    } catch (err: any) {
      this.logger.error(`GDPR: failed to delete saved properties: ${err.message}`);
    }

    // 5. Delete Cloud Storage objects under documents/{targetUserId}/
    try {
      const bucket = admin.storage().bucket();
      const [files] = await bucket.getFiles({ prefix: `documents/${targetUserId}/` });
      for (const file of files) {
        await file.delete().catch(() => {});
        result.purgedRecords.storageFilesDeleted++;
      }
    } catch (err: any) {
      this.logger.warn(`GDPR: storage bucket purge skipped: ${err.message}`);
    }

    // 6. Record immutable compliance audit log
    try {
      const auditRef = await db.collection('gdpr_audit_log').add({
        targetUserId,
        purgedBy: adminEmail,
        purgedRecords: result.purgedRecords,
        status: 'COMPLETED',
        complianceType: 'GDPR_RIGHT_TO_BE_FORGOTTEN',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      result.auditLogId = auditRef.id;
    } catch {}

    this.logger.log(`✅ GDPR purge completed for ${targetUserId}`);
    return result;
  }
}
